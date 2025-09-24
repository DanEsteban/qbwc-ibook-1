import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

export function parseCustomers(responseXml: string) {
     const json = parser.parse(responseXml);
     const rs = json?.QBXML?.QBXMLMsgsRs?.CustomerQueryRs;
     const arr = Array.isArray(rs?.CustomerRet) ? rs.CustomerRet : rs?.CustomerRet ? [rs.CustomerRet] : [];
     return arr.map((c: any) => ({
          ListID: c.ListID,
          Name: c.Name,
          FullName: c.FullName,
          IsActive: c.IsActive === 'true' || c.IsActive === true,
          CompanyName: c.CompanyName ?? null,
          Phone: c.Phone ?? null,
          Email: c.Email ?? null,
          BillAddress: {
               Addr1: c.BillAddress?.Addr1 ?? null,
               City: c.BillAddress?.City ?? null,
               State: c.BillAddress?.State ?? null,
               PostalCode: c.BillAddress?.PostalCode ?? null,
               Country: c.BillAddress?.Country ?? null,
          },
          TimeModified: c.TimeModified,
     }));
}

export function parseItems(responseXml: string) {
     const json = parser.parse(responseXml);
     const rs = json?.QBXML?.QBXMLMsgsRs?.ItemInventoryQueryRs;
     const arr = Array.isArray(rs?.ItemInventoryRet) ? rs.ItemInventoryRet : rs?.ItemInventoryRet ? [rs.ItemInventoryRet] : [];
     return arr.map((i: any) => ({
          ListID: i.ListID,
          Name: i.Name,
          FullName: i.FullName,
          IsActive: i.IsActive === 'true' || i.IsActive === true,
          ManufacturerPartNumber: i.ManufacturerPartNumber ?? null,
          SalesDesc: i.SalesDesc ?? null,
          SalesPrice: Number(i.SalesPrice ?? 0),
          QuantityOnHand: Number(i.QuantityOnHand ?? 0),
          TimeModified: i.TimeModified,
     }));
}

export function parseInvoices(responseXml: string) {
     const json = parser.parse(responseXml);
     const rs = json?.QBXML?.QBXMLMsgsRs?.InvoiceQueryRs;
     const arr = Array.isArray(rs?.InvoiceRet) ? rs.InvoiceRet : rs?.InvoiceRet ? [rs.InvoiceRet] : [];
     return arr.map((inv: any) => ({
          TxnID: inv.TxnID,
          TxnDate: inv.TxnDate,
          RefNumber: inv.RefNumber ?? null,
          CustomerRef: {
               ListID: inv.CustomerRef?.ListID ?? null,
               FullName: inv.CustomerRef?.FullName ?? null,
          },
          Subtotal: Number(inv.Subtotal ?? 0),
          SalesTaxTotal: Number(inv.SalesTaxTotal ?? 0),
          TotalAmount: Number(inv.TotalAmount ?? 0),
          BalanceRemaining: Number(inv.BalanceRemaining ?? 0),
          Memo: inv.Memo ?? null,
          TimeModified: inv.TimeModified,
          Lines: (Array.isArray(inv.InvoiceLineRet) ? inv.InvoiceLineRet : inv.InvoiceLineRet ? [inv.InvoiceLineRet] : []).map((ln: any) => ({
               TxnLineID: ln.TxnLineID,
               ItemRef: {
                    ListID: ln.ItemRef?.ListID ?? null,
                    FullName: ln.ItemRef?.FullName ?? null,
               },
               Desc: ln.Desc ?? null,
               Quantity: ln.Quantity != null ? Number(ln.Quantity) : null,
               Rate: ln.Rate != null ? Number(ln.Rate) : null,
               Amount: ln.Amount != null ? Number(ln.Amount) : null,
               UnitOfMeasure: ln.UnitOfMeasure ?? null,
          })),
     }));
}