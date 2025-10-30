import { AppConfig } from 'src/config/app.config';
import { creditMemoQueryRq, invoiceQueryRq } from '../qbxml/builders';

export class InvoicesExporter {
    buildInvoiceRequest(
        iteratorId?: string,
        maxResults?: number,
        dateFrom?: string,
        dateTo?: string,
        onlyModified?: boolean
    ): string {
        const xml = invoiceQueryRq(iteratorId ?? undefined, maxResults, dateFrom ?? undefined, dateTo ?? undefined, onlyModified);

        console.log('📤 QBXML (from exporter) first 250:', xml.slice(0, 250));
        if (AppConfig.debugXml) {
            console.log('🔍 Invoice XML len:', xml.length);
            console.log('🔍 Invoice XML preview:', xml.slice(0, 1500));
        }
        return xml;
    }

    buildCreditMemoRequest(
        iteratorId?: string | null,
        maxResults?: number,
        dateFrom?: string | null,
        dateTo?: string | null,
        onlyModified?: boolean
    ): string {
        //const xml = creditMemoQueryRq(iteratorId, maxResults, dateFrom, dateTo, onlyModified);
        const xml = creditMemoQueryRq(iteratorId ?? undefined, maxResults, dateFrom ?? undefined, dateTo ?? undefined, onlyModified);

        if (AppConfig.debugXml) {
            console.log('🔍 CreditMemo XML len:', xml.length);
            console.log('🔍 CreditMemo XML preview:', xml.slice(0, 1500));
        }
        return xml;
    }
}