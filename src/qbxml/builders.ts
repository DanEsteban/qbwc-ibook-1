import { AppConfig } from '../config/app.config';

function envelope(inner: string) {
    const v = AppConfig.qbxmlVersion;

    const xml = `<?xml version="1.0" encoding="utf-8"?>
                    <?qbxml version="${v}"?>
                        <QBXML>
                            <QBXMLMsgsRq onError="stopOnError">
                            ${inner}
                            </QBXMLMsgsRq>
                        </QBXML>`;

    return xml;
}


export function customerQueryRq(iteratorId?: string, max?: number) {
    const it = iteratorId ? ` iterator="Continue" iteratorID="${iteratorId}"` : ' iterator="Start"';
    const m = max ?? AppConfig.maxReturned;
    return envelope(
        `<CustomerQueryRq${it}>
            <MaxReturned>${m}</MaxReturned>
            <ActiveStatus>All</ActiveStatus>
        </CustomerQueryRq>`
    );
}

export function itemInventoryQueryRq(iteratorId?: string, max?: number) {
    const it = iteratorId ? ` iterator="Continue" iteratorID="${iteratorId}"` : ' iterator="Start"';
    const m = max ?? AppConfig.maxReturned;
    return envelope(
        `<ItemInventoryQueryRq${it}>
            <MaxReturned>${m}</MaxReturned>
            <ActiveStatus>All</ActiveStatus>
        </ItemInventoryQueryRq>`
    );
}

export function invoiceQueryRq(
    iteratorId?: string,
    max?: number,
    fromDate?: string,
    toDate?: string,
    onlyModified?: boolean
) {
    const it = iteratorId ? ` iterator="Continue" iteratorID="${iteratorId}"` : ' iterator="Start"';
    const m = max ?? AppConfig.maxReturned;

    let filters = '';
    if (onlyModified && fromDate) {
        filters += `<FromModifiedDate>${fromDate}</FromModifiedDate>\n`;
        if (toDate) filters += `<ToModifiedDate>${toDate}</ToModifiedDate>\n`;
    } else if (fromDate) {
        filters += `<TxnDateRangeFilter>
<FromTxnDate>${fromDate}</FromTxnDate>\n`;
        if (toDate) filters += `<ToTxnDate>${toDate}</ToTxnDate>\n`;
        filters += `</TxnDateRangeFilter>\n`;
    }

    const inner = `<InvoiceQueryRq${it}>
<MaxReturned>${m}</MaxReturned>
${filters}<IncludeLineItems>true</IncludeLineItems>
</InvoiceQueryRq>`;

    const xml = envelope(inner);
    console.log('🔍 XML Length:', xml.length);
    console.log('🔍 Full XML:', xml);
    return xml;
}

export function creditMemoQueryRq(
    iteratorId?: string,
    max?: number,
    fromDate?: string,
    toDate?: string,
    onlyModified?: boolean
) {
    const it = iteratorId ? ` iterator="Continue" iteratorID="${iteratorId}"` : ' iterator="Start"';
    const m = max ?? AppConfig.maxReturned;

    let filters = '';
    if (onlyModified && fromDate) {
        filters += `<FromModifiedDate>${fromDate}</FromModifiedDate>\n`;
        if (toDate) filters += `<ToModifiedDate>${toDate}</ToModifiedDate>\n`;
    } else if (fromDate) {
        filters += `<TxnDateRangeFilter>
<FromTxnDate>${fromDate}</FromTxnDate>\n`;
        if (toDate) filters += `<ToTxnDate>${toDate}</ToTxnDate>\n`;
        filters += `</TxnDateRangeFilter>\n`;
    }

    return envelope(
        `<CreditMemoQueryRq${it}>
<MaxReturned>${m}</MaxReturned>
${filters}<IncludeLineItems>true</IncludeLineItems>
</CreditMemoQueryRq>`
    );
}

export function companyQueryRq() {
    return envelope(`<CompanyQueryRq />`);
}