import { parseIterator } from '../qbxml/iterators';
import { CustomersExporter } from '../exporters/customers.exporter';
import { ItemsExporter } from '../exporters/items.exporter';
import { InvoicesExporter } from '../exporters/invoices.exporter';
import { parseCustomers, parseItems, parseInvoices } from '../qbxml/parsers';
import { Sink } from '../sink/sink';

type JobType = 'customers' | 'items' | 'invoices';

interface Job {
  type: JobType;
  iteratorId?: string;
  recordCount: number;
  maxRecords: number;
  seq: number;
  batchSize: number;
}

const entityMap: Record<JobType, 'clientes' | 'productos' | 'facturas'> = {
  customers: 'clientes',
  items: 'productos',
  invoices: 'facturas',
};

export class JobQueue {
  private sessions = new Map<string, Job[]>();
  private lastError = new Map<string, string>();

  constructor(private readonly sink: Sink) {}

  createSession(ticket: string) {
    const jobs: Job[] = [
      {
        type: 'customers',
        recordCount: 0,
        maxRecords: 200,
        seq: 0,
        batchSize: 50,
      },
      { type: 'items', recordCount: 0, maxRecords: 200, seq: 0, batchSize: 50 },
      {
        type: 'invoices',
        recordCount: 0,
        maxRecords: 200,
        seq: 0,
        batchSize: 50,
      },
    ];
    this.sessions.set(ticket, jobs);
    console.log('🎫 Session created - sending to HTTP sink');
  }

  next(ticket: string): { qbxml: string } | null {
    const q = this.sessions.get(ticket);
    if (!q || q.length === 0) {
      console.log('✅ No more jobs for ticket:', ticket);
      return null;
    }
    const job = q[0];

    if (job.recordCount >= job.maxRecords) {
      console.log(
        `🛑 ${job.type} limit reached: ${job.recordCount}/${job.maxRecords}`,
      );
      this.sink
        .onDone(entityMap[job.type], {
          ticket,
          jobType: entityMap[job.type],
          seq: job.seq,
          totalSoFar: job.recordCount,
        })
        .catch(() => {});
      q.shift();
      return this.next(ticket);
    }

    try {
      const qbxml = this.buildRequest(job);
      console.log(
        `🔄 ${job.type} request (${job.recordCount}/${job.maxRecords})`,
      );
      return { qbxml };
    } catch (e: any) {
      console.error(`❌ Error building ${job.type} request:`, e.message);
      this.lastError.set(ticket, `Error in ${job.type}: ${e.message}`);
      q.shift();
      return this.next(ticket);
    }
  }

  onResponse(ticket: string, responseXml: string): number {
    const q = this.sessions.get(ticket);
    if (!q || q.length === 0) return 100;
    const job = q[0];
    console.log(`📨 Processing ${job.type} response`);

    try {
      let records: any[] = [];
      switch (job.type) {
        case 'customers':
          records = parseCustomers(responseXml);
          break;
        case 'items':
          records = parseItems(responseXml);
          break;
        case 'invoices':
          records = parseInvoices(responseXml);
          break;
      }

      const remainingAllowance = Math.max(job.maxRecords - job.recordCount, 0);
      const toSend = records.slice(0, remainingAllowance);
      job.recordCount += toSend.length;

      const entity = entityMap[job.type];
      for (let i = 0; i < toSend.length; i += job.batchSize) {
        const batch = toSend.slice(i, i + job.batchSize);
        const seq = ++job.seq;
        this.sink
          .onBatch(entity, batch, {
            ticket,
            jobType: entity,
            seq,
            totalSoFar: job.recordCount,
          })
          .catch((err) => {
            console.error('❌ Sink error:', err?.message || err);
            this.lastError.set(
              ticket,
              `Sink error ${entity}: ${err?.message || err}`,
            );
          });
      }

      const { done, nextIterator, remaining } = parseIterator(responseXml);
      if (!done && nextIterator && job.recordCount < job.maxRecords) {
        job.iteratorId = nextIterator;
        console.log(
          `⏭️ ${job.type} continues (remain from QB: ${remaining ?? '?'})`,
        );
        return 50;
      }

      console.log(`✅ ${job.type} completed with ${job.recordCount} records`);
      this.sink
        .onDone(entity, {
          ticket,
          jobType: entity,
          seq: job.seq,
          totalSoFar: job.recordCount,
        })
        .catch(() => {});
      q.shift();
      return q.length === 0 ? 100 : 10;
    } catch (e: any) {
      console.error(`❌ Error processing ${job.type}:`, e.message);
      this.lastError.set(ticket, `Error processing ${job.type}: ${e.message}`);
      q.shift();
      return q.length > 0 ? 10 : 100;
    }
  }

  getLastError(ticket: string) {
    return this.lastError.get(ticket) ?? '';
  }

  private buildRequest(job: Job): string {
    switch (job.type) {
      case 'customers':
        return new CustomersExporter().buildRequest(job.iteratorId);
      case 'items':
        return new ItemsExporter().buildRequest(job.iteratorId);
      case 'invoices':
        return new InvoicesExporter().buildRequest(job.iteratorId);
      default:
        throw new Error(`Tipo de job no soportado: ${job.type}`);
    }
  }
}
