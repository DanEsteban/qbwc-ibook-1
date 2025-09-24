import { AppConfig } from '../config/app.config';

function envelope(inner: string) {
    const v = AppConfig.qbxmlVersion;
    return `<?xml version="1.0"?>
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

export function invoiceQueryRq(iteratorId?: string, max?: number, fromModifiedDate?: string) {
    const it = iteratorId ? ` iterator="Continue" iteratorID="${iteratorId}"` : ' iterator="Start"';
    const m = max ?? AppConfig.maxReturned;

    let dateFilter = '';
    if (fromModifiedDate) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(fromModifiedDate)) {
            dateFilter = `<FromModifiedDate>${fromModifiedDate}</FromModifiedDate>`;
        } else {
            console.warn('⚠️ Fecha inválida ignorada:', fromModifiedDate);
        }
    }

    return envelope(`<InvoiceQueryRq${it}>
      ${dateFilter}
      <MaxReturned>${m}</MaxReturned>
    </InvoiceQueryRq>`);
}
