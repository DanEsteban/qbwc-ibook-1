export interface DocMeta {
  ticket: string;
  source: 'quickbooks';
  category: 'invoices';
  iteratorId?: string;
  remaining?: number;
  seq: number;
  jobId?: string;
}

export interface DocSink {
  pushDocument(meta: DocMeta, quickbooksJson: any): Promise<void>;
}
