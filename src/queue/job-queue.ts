import { XMLParser } from 'fast-xml-parser';
import { parseIterator } from '../qbxml/iterators';
import { InvoicesExporter } from '../exporters/invoices.exporter';
import { DocSink } from '../sink/sink';
import axios, { AxiosInstance } from 'axios';
import { AppConfig } from '../config/app.config';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

interface Session {
  jobId: string;
  companyId: string;
  seq: number;
}
export class JobQueue {
  private sessions = new Map<string, Session>();
  private lastError = new Map<string, string>();
  private backendClient: AxiosInstance;

  constructor(private readonly sink: DocSink) {
    this.backendClient = axios.create({
      baseURL: `${AppConfig.targetApiBase}/api`,
      headers: {
        'X-API-Key': AppConfig.targetApiKey
      }
    });
  }

  async createSession(ticket: string, companyId: string): Promise<boolean> {
    try {
      console.log('🔍 Checking for pending jobs...', { companyId });

      const response = await this.backendClient.get('/quickbooks/qbd/jobs/pending', {
        params: { companyId }
      });

      console.log('📥 Backend response:', response.data);

      // 🔧 ACCEDER AL NIVEL CORRECTO
      const jobData = response.data.data || response.data;

      if (!jobData.hasJobs) {
        console.log('⚠️ No pending jobs for company', companyId);
        return false;
      }

      const jobId = jobData.jobId;
      console.log('✅ Found pending job:', jobId);

      await this.backendClient.post(`/quickbooks/qbd/jobs/${jobId}/start`, {
        ticket
      });

      this.sessions.set(ticket, {
        jobId,
        companyId,
        seq: 0
      });

      console.log(`✅ Session created for job ${jobId}`);
      return true;

    } catch (error: any) {
      console.error('❌ Error creating session:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return false;
    }
  }

  async next(ticket: string): Promise<{ qbxml: string } | null> {
    const session = this.sessions.get(ticket);
    if (!session) return null;

    try {
      const response = await this.backendClient.get(`/quickbooks/qbd/jobs/${session.jobId}/next`);

      const jobParams = response.data.data || response.data;

      const {
        dateFrom,
        dateTo,
        documentType,
        iteratorId,
        maxResults,
        onlyModified
      } = jobParams;

      const exporter = new InvoicesExporter();
      let qbxml: string;

      // Construir request según el tipo de documento
      if (documentType === 'nota_credito') {
        qbxml = exporter.buildCreditMemoRequest(
          iteratorId,
          maxResults,
          dateFrom,
          dateTo,
          onlyModified
        );
        console.log(`Request CreditMemo (from: ${dateFrom}, to: ${dateTo})`);
      } else {
        qbxml = exporter.buildInvoiceRequest(
          iteratorId,
          maxResults,
          dateFrom,
          dateTo,
          onlyModified
        );
        console.log(`Request Invoice (from: ${dateFrom}, to: ${dateTo})`);
      }

      return { qbxml };

    } catch (error) {
      console.error('Error building request:', error.message);
      this.lastError.set(ticket, error.message);
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

      session.seq++;

      // Enviar documento al backend
      await this.sink.pushDocument(
        {
          ticket,
          source: 'quickbooks',
          category: 'invoices',
          iteratorId: nextIterator,
          remaining,
          seq: session.seq,
          jobId: session.jobId,
          companyId: session.companyId,
        },
        quickbooksJson
      );

      // Actualizar progreso en el backend
      await this.backendClient.post(`/quickbooks/qbd/jobs/${session.jobId}/progress`, {
        page: session.seq,
        iteratorId: nextIterator
      });

      // Si no terminó, continuar
      if (!done && nextIterator) {
        console.log(`Continuing... (remaining: ${remaining})`);
        return 50;
      }

      // Verificar si hay más tipos de documentos por procesar
      // const jobResponse = await this.backendClient.get(`/quickbooks/qbd/jobs/${session.jobId}/next`);
      // const nextDocType = this.getNextDocumentType(
      //   jobResponse.data.documentTypes,
      //   jobResponse.data.documentType
      // );
      const jobResponse = await this.backendClient.get(`/quickbooks/qbd/jobs/${session.jobId}/next`);
      const jobParams = jobResponse.data?.data ?? jobResponse.data;

      const nextDocType = this.getNextDocumentType(
        jobParams.documentTypes,
        jobParams.documentType
      );

      if (nextDocType) {
        // Cambiar al siguiente tipo
        await this.backendClient.post(`/quickbooks/qbd/jobs/${session.jobId}/progress`, {
          documentType: nextDocType,
          iteratorId: null,
          page: 0
        });
        session.seq = 0;
        console.log(`Switching to ${nextDocType}`);
        return 50;
      }

      // Completado
      await this.backendClient.post(`/quickbooks/qbd/jobs/${session.jobId}/complete`, {
        success: true
      });
      this.sessions.delete(ticket);
      console.log(`Job ${session.jobId} completed`);
      return 100;

    } catch (error) {
      console.error('Error processing response:', error.message);
      this.lastError.set(ticket, error.message);
      await this.completeJobWithError(session.jobId);
      this.sessions.delete(ticket);
      return 100;
    }
  }

  private getNextDocumentType(types: string[], current: string): string | null {
    const index = types.indexOf(current);
    if (index === -1 || index === types.length - 1) return null;
    return types[index + 1];
  }

  private async completeJobWithError(jobId: string) {
    try {
      await this.backendClient.post(`/quickbooks/qbd/jobs/${jobId}/complete`, {
        success: false
      });
    } catch (error) {
      console.error('Error completing job with error:', error.message);
    }
  }

  getLastError(ticket: string) {
    return this.lastError.get(ticket) ?? '';
  }
}
