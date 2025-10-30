import { AppConfig } from '../config/app.config';


function toQBDateTime(date: string, which: 'start' | 'end'): string {
    if (date.includes('T')) return date;
    return which === 'start' ? `${date}T00:00:00` : `${date}T23:59:59`;
}

function envelope(inner: string) {
    const v = AppConfig.qbxmlVersion;
    return `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="${v}"?>
<QBXML>
  <QBXMLMsgsRq onError="stopOnError">
${inner}
  </QBXMLMsgsRq>
</QBXML>`;
}

export function customerQueryRq(iteratorId?: string, max?: number) {
    const it = iteratorId ? ` iterator="Continue" iteratorID="${iteratorId}"` : ' iterator="Start"';
    const m = max ?? AppConfig.maxReturned;
    return envelope(`<CustomerQueryRq${it}>
<MaxReturned>${m}</MaxReturned>
<ActiveStatus>All</ActiveStatus>
</CustomerQueryRq>`);
}

export function itemInventoryQueryRq(iteratorId?: string, max?: number) {
    const it = iteratorId ? ` iterator="Continue" iteratorID="${iteratorId}"` : ' iterator="Start"';
    const m = max ?? AppConfig.maxReturned;
    return envelope(`<ItemInventoryQueryRq${it}>
<MaxReturned>${m}</MaxReturned>
<ActiveStatus>All</ActiveStatus>
</ItemInventoryQueryRq>`);
}
// Anterior
// export function invoiceQueryRq(
//     iteratorId?: string,
//     max?: number,
//     fromDate?: string,
//     toDate?: string,
//     onlyModified?: boolean
// ) {
//     const it = iteratorId ? ` iterator="Continue" iteratorID="${iteratorId}"` : ` iterator="Start"`;
//     const m = max ?? AppConfig.maxReturned;

//     let filters = '';
//     if (onlyModified && fromDate) {
//         const fromDT = toQBDateTime(fromDate, 'start');
//         const toDT = toDate ? toQBDateTime(toDate, 'end') : toQBDateTime(fromDate, 'end');
//         filters += `<ModifiedDateRangeFilter>
// <FromModifiedDate>${fromDT}</FromModifiedDate>
// <ToModifiedDate>${toDT}</ToModifiedDate>
// </ModifiedDateRangeFilter>
// `;
//     } else if (fromDate) {
//         const from = fromDate.includes('T') ? fromDate.split('T')[0] : fromDate;
//         const to = toDate ? (toDate.includes('T') ? toDate.split('T')[0] : toDate) : undefined;
//         filters += `<TxnDateRangeFilter>
// <FromTxnDate>${from}</FromTxnDate>
// ${to ? `<ToTxnDate>${to}</ToTxnDate>\n` : ''}</TxnDateRangeFilter>
// `;
//     }

//     const xml = envelope(`<InvoiceQueryRq${it}>
// <MaxReturned>${m}</MaxReturned>
// ${filters}<IncludeLineItems>true</IncludeLineItems>
// </InvoiceQueryRq>`);

//     if (AppConfig.debugXml) {
//         console.log('🔍 Invoice XML length:', xml.length);
//         console.log('🔍 Invoice XML (preview):', xml.slice(0, 1500));
//     }
//     return xml;
// }

//Nueva
export function invoiceQueryRq(
    iteratorId?: string,
    max?: number,
    fromDate?: string,
    toDate?: string,
    onlyModified?: boolean
): string {
    const it = iteratorId
        ? ` iterator="Continue" iteratorID="${iteratorId}"`
        : ` iterator="Start"`;

    // Per-page limit: si no llega, usa AppConfig
    const m = typeof max === 'number' ? max : AppConfig.maxReturned;

    let filters = '';
    if (onlyModified && fromDate) {
        const fromDT = toQBDateTime(fromDate, 'start');
        const toDT = toDate ? toQBDateTime(toDate, 'end') : toQBDateTime(fromDate, 'end');
        filters += `<ModifiedDateRangeFilter>
<FromModifiedDate>${fromDT}</FromModifiedDate>
<ToModifiedDate>${toDT}</ToModifiedDate>
</ModifiedDateRangeFilter>
`;
    } else if (fromDate) {
        const from = fromDate.includes('T') ? fromDate.split('T')[0] : fromDate;
        const to = toDate ? (toDate.includes('T') ? toDate.split('T')[0] : toDate) : undefined;
        filters += `<TxnDateRangeFilter>
<FromTxnDate>${from}</FromTxnDate>
${to ? `<ToTxnDate>${to}</ToTxnDate>\n` : ''}</TxnDateRangeFilter>
`;
    }

    const xml = envelope(`<InvoiceQueryRq${it}>
<MaxReturned>${m}</MaxReturned>
${filters}<IncludeLineItems>true</IncludeLineItems>
</InvoiceQueryRq>`);

    if (AppConfig.debugXml) {
        console.log('🔍 Invoice XML length:', xml.length);
        console.log('🔍 Invoice XML preview:', xml.slice(0, 1500));
    }
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
        const fromDT = toQBDateTime(fromDate, 'start');
        const toDT = toDate ? toQBDateTime(toDate, 'end') : toQBDateTime(fromDate, 'end');
        filters += `<ModifiedDateRangeFilter>
<FromModifiedDate>${fromDT}</FromModifiedDate>
<ToModifiedDate>${toDT}</ToModifiedDate>
</ModifiedDateRangeFilter>
`;
    } else if (fromDate) {
        const from = fromDate.includes('T') ? fromDate.split('T')[0] : fromDate;
        const to = toDate ? (toDate.includes('T') ? toDate.split('T')[0] : toDate) : undefined;
        filters += `<TxnDateRangeFilter>
<FromTxnDate>${from}</FromTxnDate>
${to ? `<ToTxnDate>${to}</ToTxnDate>\n` : ''}</TxnDateRangeFilter>
`;
    }

    const xml = envelope(`<CreditMemoQueryRq${it}>
<MaxReturned>${m}</MaxReturned>
${filters}<IncludeLineItems>true</IncludeLineItems>
</CreditMemoQueryRq>`);

    if (AppConfig.debugXml) {
        console.log('🔍 CreditMemo XML length:', xml.length);
        console.log('🔍 CreditMemo XML (preview):', xml.slice(0, 1500));
    }
    return xml;
}

export function companyQueryRq() {
    return envelope(`<CompanyQueryRq />`);
}