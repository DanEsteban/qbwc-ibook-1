import { creditMemoQueryRq, invoiceQueryRq } from '../qbxml/builders';

export class InvoicesExporter {
    buildInvoiceRequest(
        iteratorId?: string,
        maxResults?: number,
        dateFrom?: string,
        dateTo?: string,
        onlyModified?: boolean
    ): string {
        return invoiceQueryRq(iteratorId, maxResults, dateFrom, dateTo, onlyModified);
    }

    buildCreditMemoRequest(
        iteratorId?: string,
        maxResults?: number,
        dateFrom?: string,
        dateTo?: string,
        onlyModified?: boolean
    ): string {
        return creditMemoQueryRq(iteratorId, maxResults, dateFrom, dateTo, onlyModified);
    }
}