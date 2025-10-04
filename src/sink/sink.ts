export interface DocMeta {
  ticket: string;
  source: 'quickbooks';
  category: 'invoices';
  iteratorId?: string;
  remaining?: number;
  seq: number;          // número de mensaje / página
  jobId?: string;
  companyId?: string;
}

export interface DocSink {
  // Recibe una respuesta XML de QuickBooks convertida a JSON y la publica
  pushDocument(meta: DocMeta, quickbooksJson: any): Promise<void>;
}


