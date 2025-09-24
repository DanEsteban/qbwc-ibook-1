export type Entity = 'clientes' | 'productos' | 'facturas';

export interface BatchMeta {
  ticket: string;
  jobType: Entity;
  seq: number;
  totalSoFar: number;
  remaining?: number;
}

export interface Sink {
  onBatch(entity: Entity, records: any[], meta: BatchMeta): Promise<void>;
  onDone(entity: Entity, meta: BatchMeta): Promise<void>;
}