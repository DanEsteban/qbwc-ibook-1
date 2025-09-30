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
               'X-Company-Id': AppConfig.companyId
               // ...(AppConfig.targetApiKey ? { 'X-API-Key': AppConfig.targetApiKey } : {}),
          },
     });

     async pushDocument(meta: DocMeta, quickbooksJson: any): Promise<void> {
          const payload = {
               meta,
               quickbooks_data: quickbooksJson
          };

          try {
               const response = await this.client.post('/quickbooks/qbd/receive', payload, {
                    headers: {
                         'Idempotency-Key': `${meta.ticket}:invoices:${meta.seq}`
                    },
               });

               console.log('✅ Document sent successfully:', response.data);
          } catch (error) {
               if (error.response?.status === 409) {
                    console.log('⚠️ Document already processed (duplicate)');
                    // No es un error real, el documento ya fue procesado
                    return;
               }

               console.error('❌ Error sending document:', error.message);
               throw error;
          }
     }
}
