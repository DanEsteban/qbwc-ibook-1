import axios from 'axios';
import crypto from 'crypto';
import { Sink, Entity, BatchMeta } from './sink';
import { AppConfig } from '../config/app.config';

export class HttpSink implements Sink {
  private client = axios.create({
    baseURL: AppConfig.targetApiBase,
    timeout: 20000,
    headers: {
      'Content-Type': 'application/json',
      ...(AppConfig.targetApiKey
        ? { 'X-API-Key': AppConfig.targetApiKey }
        : {}),
    },
  });

  private endpoint(entity: Entity) {
    switch (entity) {
      case 'clientes':
        return '/import/customers';
      case 'productos':
        return '/import/items';
      case 'facturas':
        return '/import/invoices';
    }
  }

  private signature(payload: any) {
    if (!AppConfig.targetApiSecret) return '';
    const body = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', AppConfig.targetApiSecret)
      .update(body)
      .digest('hex');
  }

  async onBatch(entity: Entity, records: any[], meta: BatchMeta) {
    if (!records.length) return;

    const payload = { meta, records };
    const headers: Record<string, string> = {
      'Idempotency-Key': `${meta.ticket}:${entity}:${meta.seq}`,
    };

    const sig = this.signature(payload);
    if (sig) headers['X-Signature'] = sig;

    console.log(
      '📤 Enviando a:',
      `${AppConfig.targetApiBase}${this.endpoint(entity)}`,
    );
    console.log('📤 Headers:', headers);
    console.log('📤 Payload records:', records.length);

    try {
      await this.client.post(this.endpoint(entity), payload, { headers });
      console.log('✅ Batch enviado exitosamente');
    } catch (error) {
      console.error(
        '❌ Error enviando batch:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async onDone(entity: Entity, meta: BatchMeta) {
    const payload = { meta, done: true };
    const headers: Record<string, string> = {
      'Idempotency-Key': `${meta.ticket}:${entity}:done`,
    };
    const sig = this.signature(payload);
    if (sig) headers['X-Signature'] = sig;

    await this.client
      .post(this.endpoint(entity) + '/done', payload, { headers })
      .catch(() => {});
  }
}