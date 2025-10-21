import axios from 'axios';
import { DocMeta, DocSink } from './sink';
import { AppConfig } from '../config/app.config';

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
          const payload = {
               meta,
               quickbooks_data: quickbooksJson
          };

          const jobId = meta.jobId ?? null;

          try {
               await this.client.post('/quickbooks/qbd/receive', payload, {
                    headers: {
                         'Idempotency-Key': `${meta.ticket}:${meta.category}:${meta.seq}`,
                         'X-Company-Id': AppConfig.companyId,
                         ...(jobId && { 'X-Job-Id': jobId }),
                    },
               });
               console.log('✅ Document sent successfully');
          } catch (error: any) {
               if (error.response?.status === 409) {
                    console.log('⚠️ Document already processed (duplicate)');
                    return;
               }
               console.error('❌ Error sending document:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
               });
               throw error;
          }
     }

}
