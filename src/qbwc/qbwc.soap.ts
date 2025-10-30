import { AppConfig } from '../config/app.config';
import { JobQueue } from '../queue/job-queue';

export function qbwcServiceFactory(jobQueue: JobQueue) {
  return {
    QBWebConnectorSvc: {
      QBWebConnectorSvcSoap: {
        serverVersion: (_args: any) => {
          return { serverVersionResult: '1.0.0' };
        },

        clientVersion: ({ strVersion }: { strVersion: string }) => {
          return { clientVersionResult: '' };
        },

        authenticate: async ({ strUserName, strPassword }: any) => {
          if (strUserName !== AppConfig.qbwcUser || strPassword !== AppConfig.qbwcPass) {
            console.log('❌ Authentication FAILED - Invalid credentials');
            return { authenticateResult: { string: ['', 'not valid user'] } };
          }

          const ticket = `${Date.now()}-${Math.random()}`;
          const hasJobs = await jobQueue.createSession(ticket);
          
          if (!hasJobs) {
            console.log('⚠️ No pending jobs for this company');
            return { authenticateResult: { string: ['', 'none'] } };
          }

          console.log('✅ Authentication successful, ticket:', ticket);
          console.log('🏢 Company:', AppConfig.companyId);
          return { authenticateResult: { string: [ticket, ''] } };
        },

        sendRequestXML: async ({ ticket }: any) => { 
          console.log('📤 sendRequestXML called with ticket:', ticket);
          
          const next = await jobQueue.next(ticket);
          const qbxml = next?.qbxml ?? '';

          if (qbxml) {
            console.log('📋 Sending request:', qbxml.substring(0, 200) + '...');
          } else {
            console.log('✅ No more requests');
          }

          return { sendRequestXMLResult: qbxml };
        },

        receiveResponseXML: async ({ ticket, response, hresult, message }: any) => {
          console.log('📥 receiveResponseXML called with ticket:', ticket);

          if (hresult && hresult !== '0') {
            console.log('⚠️ QB Error:', hresult, message);
          }

          try {
            const progress = await jobQueue.onResponse(ticket, response);
            console.log('📊 Progress:', progress + '%');
            return { receiveResponseXMLResult: progress };
          } catch (e: any) {
            console.error('❌ Error processing response:', e.message);
            return { receiveResponseXMLResult: 100 };
          }
        },

        getLastError: ({ ticket }: any) => {
          console.log('🔍 getLastError called with ticket:', ticket);
          return { getLastErrorResult: jobQueue.getLastError(ticket) };
        },

        connectionError: (args: any) => {
          console.log('🔌 connectionError called:', args);
          return { connectionErrorResult: 'done' };
        },

        closeConnection: (_args: any) => {
          console.log('🔒 closeConnection called');
          return { closeConnectionResult: 'OK' };
        },
      },
    },
  };
}