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

function toQBDateTime(date: string, which: 'start' | 'end'): string {
    // si te llega ya con 'T', la respetamos
    if (date.includes('T')) return date;
    return which === 'start' ? `${date}T00:00:00` : `${date}T23:59:59`;
}

export function invoiceQueryRq(
    iteratorId?: string,
    max?: number,
    fromDate?: string,
    toDate?: string,
    onlyModified?: boolean
) {
    const it = iteratorId
        ? ` iterator="Continue" iteratorID="${iteratorId}"`
        : ` iterator="Start"`;

    const m = max ?? AppConfig.maxReturned;

    let filters = '';

    if (onlyModified && fromDate) {
        // 🔧 Filtro por fecha de *modificación* (correcto para QBXML)
        const fromDT = toQBDateTime(fromDate, 'start');
        const toDT = toDate ? toQBDateTime(toDate, 'end') : toQBDateTime(fromDate, 'end');

        filters += `<ModifiedDateRangeFilter>
<FromModifiedDate>${fromDT}</FromModifiedDate>
<ToModifiedDate>${toDT}</ToModifiedDate>
</ModifiedDateRangeFilter>
`;
    } else if (fromDate) {
        // 🔧 Filtro por fecha de *transacción* (solo fecha, sin 'T' normalmente)
        const from = fromDate.includes('T') ? fromDate.split('T')[0] : fromDate;
        const to = toDate ? (toDate.includes('T') ? toDate.split('T')[0] : toDate) : undefined;

        filters += `<TxnDateRangeFilter>
<FromTxnDate>${from}</FromTxnDate>
${to ? `<ToTxnDate>${to}</ToTxnDate>\n` : ''}</TxnDateRangeFilter>
`;
    }
    // Nota: si no hay fromDate, no ponemos filtros de fecha (válido).

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