import axios from 'axios';
import { DocMeta, DocSink } from './sink';
import { AppConfig } from '../config/app.config';
import pRetry from 'p-retry';

export class HttpDocSink implements DocSink {
     private client = axios.create({
          baseURL: `${AppConfig.targetApiBase}/api`,
          timeout: 20000,
          headers: {
               'Content-Type': 'application/json',
               'X-API-Key': AppConfig.targetApiKey,
          },
     });

     async pushDocument(meta: DocMeta, quickbooksJson: any): Promise<void> {
          const payload = { meta, quickbooks_data: quickbooksJson };
          const jobId = meta.jobId ?? null;

          const headers = {
               'Idempotency-Key': `${meta.ticket}:${meta.category}:${meta.iteratorId ?? 'none'}:${meta.seq}:${jobId ?? 'none'}`,
               'X-Company-Id': AppConfig.companyId,
               ...(jobId && { 'X-Job-Id': jobId }),
          };

          await pRetry(
               async () => {
                    await this.client.post('/quickbooks/qbd/receive', payload, { headers, timeout: 20000 });
               },
               { retries: 3, factor: 2, minTimeout: 1500, maxTimeout: 7000 }
          );

          console.log('✅ Document sent successfully');
     }

}
