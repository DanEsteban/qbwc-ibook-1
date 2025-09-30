import { XMLParser } from 'fast-xml-parser';
import { parseIterator } from '../qbxml/iterators';
import { InvoicesExporter } from '../exporters/invoices.exporter';
import { DocSink } from '../sink/sink';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

interface Job {
  iteratorId?: string;
  seq: number; // contador de página/respuesta
}

export class JobQueue {
  private sessions = new Map<string, Job>();
  private lastError = new Map<string, string>();

  constructor(private readonly sink: DocSink) { }

  createSession(ticket: string) {
    this.sessions.set(ticket, { iteratorId: undefined, seq: 0 });
    console.log('🎫 Session created - invoices only → /documents');
  }

  next(ticket: string): { qbxml: string } | null {
    const job = this.sessions.get(ticket);
    if (!job) return null;

    try {
      const qbxml = new InvoicesExporter().buildRequest(job.iteratorId);
      console.log(`🔄 invoices request (iteratorId=${job.iteratorId ?? 'Start'})`);
      return { qbxml };
    } catch (e: any) {
      console.error('❌ Error building invoices request:', e.message);
      this.lastError.set(ticket, `Error in invoices: ${e.message}`);
      this.sessions.delete(ticket);
      return null;
    }
  }

  onResponse(ticket: string, responseXml: string): number {
    const job = this.sessions.get(ticket);
    if (!job) return 100;

    try {
      // 1) Convertir XML → JSON (completo, sin perder estructura)
      const quickbooksJson = parser.parse(responseXml);

      // 2) Empujar documento al backend
      const { done, nextIterator, remaining } = parseIterator(responseXml);
      const seq = ++job.seq;
      this.sink.pushDocument(
        {
          ticket,
          source: 'quickbooks',
          category: 'invoices',
          iteratorId: job.iteratorId,
          remaining,
          seq,
        },
        quickbooksJson
      ).catch(err => {
        console.error('❌ pushDocument error:', err?.message || err);
        this.lastError.set(ticket, `Sink error: ${err?.message || err}`);
      });

      // 3) Continuación del iterator
      if (!done && nextIterator) {
        job.iteratorId = nextIterator;
        console.log(`⏭️ invoices continues (remaining from QB: ${remaining ?? '?'})`);
        return 50; // indicar a QBWC que hay más trabajo
      }

      // 4) Completado
      console.log(`✅ invoices completed (pages: ${job.seq})`);
      this.sessions.delete(ticket);
      return 100;

    } catch (e: any) {
      console.error('❌ Error processing invoices:', e.message);
      this.lastError.set(ticket, `Error processing invoices: ${e.message}`);
      this.sessions.delete(ticket);
      return 100;
    }
  }

  getLastError(ticket: string) {
    return this.lastError.get(ticket) ?? '';
  }
}
