import { invoiceQueryRq } from '../qbxml/builders';
// import dayjs from 'dayjs';

export class InvoicesExporter {
  buildRequest(iteratorId?: string) {
    // Si quieres filtrar por fecha:
    // const from = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
    // return invoiceQueryRq(iteratorId, 10, from);
    return invoiceQueryRq(iteratorId, 10);
  }
}
