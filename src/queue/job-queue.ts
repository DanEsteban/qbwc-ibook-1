import { XMLParser } from 'fast-xml-parser';
import { parseIterator } from '../qbxml/iterators';
import { InvoicesExporter } from '../exporters/invoices.exporter';
import { DocSink } from '../sink/sink';
import axios, { AxiosInstance } from 'axios';
import { AppConfig } from '../config/app.config';


const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

type Session = {
  jobId: string;
  seq: number;           // páginas (para progreso)
  sentCount: number;     // documentos enviados acumulados
  maxResults?: number;   // límite global del job (cap)
};

type CanonicalDoc = 'invoice' | 'credit_memo';

const DOC_MAP = {
  FACTURA: 'invoice',
  NOTA_CREDITO: 'credit_memo',
  factura: 'invoice',
  nota_credito: 'credit_memo',
  invoice: 'invoice',          // idempotente
  credit_memo: 'credit_memo',  // idempotente
} as const;

function normalizeDocumentType(input?: string | null): CanonicalDoc {
  if (!input) return 'invoice';
  const key = String(input).trim();
  const mapped = (DOC_MAP as Record<string, CanonicalDoc | undefined>)[key];
  if (mapped) return mapped;
  const k = key.toLowerCase().replace(/[\s-]/g, '');
  if (k === 'creditmemo' || k === 'creditmem o') return 'credit_memo';
  return 'invoice';
}

export class JobQueue {
  private sessions = new Map<string, Session>();
  private lastError = new Map<string, string>();
  private backendClient: AxiosInstance;

  constructor(private readonly sink: DocSink) {
    this.backendClient = axios.create({
      baseURL: `${AppConfig.targetApiBase}/api`,
      headers: {
        'X-API-Key': AppConfig.targetApiKey,
      },
      timeout: 20000,
    });
  }

  // ✅ Helper para respuestas del backend
  private unwrapResponse(response: any) {
    return response.data?.data ?? response.data;
  }

  async createSession(ticket: string): Promise<boolean> {
    try {
      console.log('🔍 Checking for pending jobs...', {
        companyId: AppConfig.companyId,
        apiKey: AppConfig.targetApiKey ? '***' + AppConfig.targetApiKey.slice(-4) : 'NOT SET' // ✅ Log parcial
      });

      const response = await this.backendClient.get('/quickbooks/qbd/jobs/pending', {
        params: { companyId: AppConfig.companyId }
      });

      const jobData = this.unwrapResponse(response);

      if (!jobData.hasJobs) {
        console.log('⚠️ No pending jobs for company', AppConfig.companyId);
        return false;
      }

      const jobId = jobData.jobId;
      console.log('✅ Found pending job:', jobId);

      await this.backendClient.post(`/quickbooks/qbd/jobs/${jobId}/start`, {
        ticket
      });

      this.sessions.set(ticket, {
        jobId,
        seq: 0,
        sentCount: 0,
      });

      console.log(`✅ Session created for job ${jobId}`);
      return true;

    } catch (error: any) {
      console.error('❌ Error creating session:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.config?.headers
      });
      return false;
    }
  }

  private async reportError(
    jobId: string,
    error: {
      type: 'connection' | 'authentication' | 'qbxml' | 'processing' | 'timeout';
      message: string;
      code?: string;
      context?: any;
    }
  ): Promise<void> {
    try {
      await this.backendClient.post(
        `/quickbooks/qbd/jobs/${jobId}/error`,
        error
      );
    } catch (err) {
      console.error(`Failed to report error for job ${jobId}:`, err);
    }
  }

  async next(ticket: string): Promise<{ qbxml: string } | null> {
    const session = this.sessions.get(ticket);
    if (!session) return null;

    try {
      const response = await this.backendClient.get(
        `/quickbooks/qbd/jobs/${session.jobId}/next`,
        { timeout: 10000 }
      );
      const jobParams = this.unwrapResponse(response);

      // Seteamos el límite global UNA vez
      if (!session.maxResults && typeof jobParams.maxResults === 'number') {
        session.maxResults = jobParams.maxResults; // <-- cap global (25/50/100)
      }

      // ✅ LOG para inspección
      console.log('📋 Job parameters received:', {
        dateFrom: jobParams.dateFrom,
        dateTo: jobParams.dateTo,
        maxResults: jobParams.maxResults,
        documentType: jobParams.documentType,
        iteratorId: jobParams.iteratorId,
        onlyModified: jobParams.onlyModified
      });

      // ✅ Desestructura DESPUÉS de recibir
      const {
        dateFrom,
        dateTo,
        documentType,
        iteratorId,
        maxResults,
        onlyModified
      } = jobParams;

      // ✅ Normaliza el tipo (enum, snake_case o canonical → canonical)
      const kind = normalizeDocumentType(documentType);

      const exporter = new InvoicesExporter();
      const qbxml =
        kind === 'credit_memo'
          ? exporter.buildCreditMemoRequest(iteratorId, maxResults, dateFrom, dateTo, onlyModified)
          : exporter.buildInvoiceRequest(iteratorId, maxResults, dateFrom, dateTo, onlyModified);

      return { qbxml };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error building request';
      await this.reportError(session.jobId, {
        type: error.code === 'ECONNABORTED' ? 'timeout' : 'processing',
        message: errorMessage,
        code: error.code,
        context: {
          endpoint: 'next',
          ticket,
          jobId: session.jobId
        }
      });

      console.error(`❌ Error in next():`, errorMessage);
      this.lastError.set(ticket, errorMessage);
      await this.completeJobWithError(session.jobId);
      this.sessions.delete(ticket);
      return null;
    }
  }

  async onResponse(ticket: string, responseXml: string): Promise<number> {
    const session = this.sessions.get(ticket);
    if (!session) return 100;

    try {
      const quickbooksJson = parser.parse(responseXml);
      const { done, nextIterator, remaining } = parseIterator(responseXml);

      // Verificar estado de QuickBooks (Info/Warn/Error)
      const qbStatus = this.extractQBStatus(quickbooksJson);
      if (qbStatus) {
        const { code, severity, message } = qbStatus;

        if (severity === 'Error') {
          console.error('QuickBooks Error:', qbStatus);

          await this.reportError(session.jobId, {
            type: 'qbxml',
            message: `QB Error ${code}: ${message}`,
            code: String(code),
            context: { iteratorId: nextIterator, remaining }
          });

          this.lastError.set(ticket, `QB Error ${code}: ${message}`);
          await this.completeJobWithError(session.jobId);
          this.sessions.delete(ticket);
          return 100;
        }

        if (severity === 'Warn') {
          console.warn('QuickBooks Warning:', qbStatus);
          // seguimos el flujo normal; no cortamos el job
        } else {
          // Info: log suave
          console.log('QuickBooks Info:', qbStatus);
        }
      }
      // Verificar si hay datos válidos
      if (!this.hasValidData(quickbooksJson)) {
        await this.backendClient.post(`/quickbooks/qbd/jobs/${session.jobId}/complete`, { success: true });
        this.sessions.delete(ticket);
        return 100;
      }
      session.seq++;


      // Cuenta de documentos en este batch
      const batchCount = this.countBatch(quickbooksJson);
      session.seq++;
      session.sentCount += batchCount;

      // Enviar lote completo
      await this.sink.pushDocument(
        {
          ticket,
          source: 'quickbooks',
          category: 'invoices',
          iteratorId: nextIterator,
          remaining,
          seq: session.seq,
          jobId: session.jobId,
        },
        quickbooksJson
      );

      // Actualizar progreso
      await this.backendClient.post(
        `/quickbooks/qbd/jobs/${session.jobId}/progress`,
        { page: session.seq, iteratorId: nextIterator }
      );

      // 🚫 HARD-STOP: cortar cuando alcance el límite global del job
      if (session.maxResults && session.sentCount >= session.maxResults) {
        console.log(`🔚 Límite global ${session.maxResults} alcanzado. Cerrando job ${session.jobId}.`);
        await this.backendClient.post(`/quickbooks/qbd/jobs/${session.jobId}/complete`, { success: true });
        this.sessions.delete(ticket);
        return 100;
      }


      // Si hay más páginas del mismo tipo, continúa
      if (!done && nextIterator) {
        console.log(`Continuing... (remaining: ${remaining})`);
        // 💤 micro-pausa opcional para no saturar QB:
        // await new Promise(r => setTimeout(r, 300));
        return 50;
      }

      // Verificar siguiente tipo de documento
      const jobResponse = await this.backendClient.get(
        `/quickbooks/qbd/jobs/${session.jobId}/next`
      );
      const jobParams = this.unwrapResponse(jobResponse);

      const typesNormalized: CanonicalDoc[] = Array.isArray(jobParams.documentTypes)
        ? jobParams.documentTypes.map((t: string) => normalizeDocumentType(t))
        : [];

      const currentNormalized: CanonicalDoc = normalizeDocumentType(jobParams.documentType);
      const nextDocType = this.getNextDocumentType(typesNormalized, currentNormalized);

      if (nextDocType) {
        await this.backendClient.post(
          `/quickbooks/qbd/jobs/${session.jobId}/progress`,
          {
            documentType: nextDocType,
            iteratorId: null,
            page: 0
          }
        );
        session.seq = 0;
        console.log(`Switching to ${nextDocType}`);
        return 50;
      }

      // Completado
      await this.backendClient.post(
        `/quickbooks/qbd/jobs/${session.jobId}/complete`,
        { success: true }
      );
      this.sessions.delete(ticket);
      console.log(`Job ${session.jobId} completed`);
      return 100;

    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error processing response';

      // 🔥 REPORTAR ERROR DE PROCESAMIENTO
      await this.reportError(session.jobId, {
        type: 'processing',
        message: errorMessage,
        code: error.code,
        context: {
          endpoint: 'onResponse',
          ticket,
          seq: session.seq
        }
      });

      console.error('Error processing response:', errorMessage);
      this.lastError.set(ticket, errorMessage);
      await this.completeJobWithError(session.jobId);
      this.sessions.delete(ticket);
      return 100;
    }
  }
  // ✅ AGREGAR: Método para verificar si hay datos válidos
  private hasValidData(json: any): boolean {
    const msgsRs = json?.QBXML?.QBXMLMsgsRs;
    if (!msgsRs) return false;

    // Verificar InvoiceQueryRs
    const invoiceRet = msgsRs.InvoiceQueryRs?.InvoiceRet;
    if (invoiceRet && (Array.isArray(invoiceRet) ? invoiceRet.length > 0 : true)) {
      return true;
    }

    // Verificar CreditMemoQueryRs
    const creditMemoRet = msgsRs.CreditMemoQueryRs?.CreditMemoRet;
    if (creditMemoRet && (Array.isArray(creditMemoRet) ? creditMemoRet.length > 0 : true)) {
      return true;
    }

    return false;
  }

  private countBatch(json: any): number {
    const msgsRs = json?.QBXML?.QBXMLMsgsRs;
    const invoiceRet = msgsRs?.InvoiceQueryRs?.InvoiceRet;
    const creditMemoRet = msgsRs?.CreditMemoQueryRs?.CreditMemoRet;

    if (Array.isArray(invoiceRet)) return invoiceRet.length;
    if (Array.isArray(creditMemoRet)) return creditMemoRet.length;
    if (invoiceRet) return 1;
    if (creditMemoRet) return 1;
    return 0;
  }


  // ✅ AGREGAR: Método para extraer errores de QuickBooks
  private extractQBStatus(json: any): { code: number; severity: 'Info' | 'Warn' | 'Error'; message: string } | null {
    const msgsRs = json?.QBXML?.QBXMLMsgsRs;
    if (!msgsRs) return null;

    // Busca el primer Rs relevante que venga en la respuesta
    const candidates = [
      msgsRs.InvoiceQueryRs,
      msgsRs.CreditMemoQueryRs,
      // si luego agregas más tipos, añádelos aquí:
      // msgsRs.SalesReceiptQueryRs, msgsRs.PaymentQueryRs, ...
    ].filter(Boolean);

    const rs = candidates[0];
    if (!rs) return null;

    const code = Number(rs.statusCode ?? 0);
    const severity = (rs.statusSeverity ?? 'Info') as 'Info' | 'Warn' | 'Error';
    const message = String(rs.statusMessage ?? '');

    return { code, severity, message };
  }

  private getNextDocumentType(types: string[], current: string): string | null {
    // ✅ Validar que types sea array
    if (!Array.isArray(types)) return null;

    const index = types.indexOf(current);
    if (index === -1 || index === types.length - 1) return null;
    return types[index + 1];
  }

  private async completeJobWithError(jobId: string) {
    try {
      console.log(`⚠️ Completing job ${jobId} with error status`);
      await this.backendClient.post(
        `/quickbooks/qbd/jobs/${jobId}/complete`,
        { success: false },
        {
          headers: {
            'X-Company-Id': AppConfig.companyId
          }
        }
      );
    } catch (error: any) {
      console.error('❌ Error completing job with error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }

  getLastError(ticket: string) {
    return this.lastError.get(ticket) ?? '';
  }
}