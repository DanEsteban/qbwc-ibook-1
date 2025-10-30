import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.COMPANY_ID) {
  throw new Error('❌ COMPANY_ID is required in environment variables');
}

if (!process.env.TARGET_API_KEY) {
  throw new Error('❌ TARGET_API_KEY is required in environment variables');
}

// export const AppConfig = {
//   port: Number(process.env.PORT ?? 3005),x
//   qbwcUser: process.env.QBWC_USER ?? 'qbwc-user',x
//   qbwcPass: process.env.QBWC_PASS ?? 'password123',x
//   exportDir: process.env.EXPORT_DIR ?? './exports',
//   qbxmlVersion: process.env.QBXML_VERSION ?? '13.0',x
//   maxReturned: Number(process.env.MAX_RETURNED ?? 50),x
//   baseUrl: process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3005}`,x
//   companyId: process.env.COMPANY_ID,x
//   targetApiBase: process.env.TARGET_API_BASE ?? 'http://localhost:3001',x
//   targetApiKey: process.env.TARGET_API_KEY,x
//   targetApiSecret: process.env.TARGET_API_SECRET ?? '',
//   debugXml: process.env.DEBUG_QBXML === 'true',
// };

export const AppConfig = {
  port: Number(process.env.PORT ?? 3005),
  baseUrl: process.env.BASE_URL ?? 'http://localhost:3005',
  targetApiBase: process.env.TARGET_API_BASE ?? 'http://localhost:4000',
  targetApiKey: process.env.TARGET_API_KEY ?? '',
  companyId: process.env.COMPANY_ID ?? 'default',
  qbxmlVersion: process.env.QBXML_VERSION ?? '13.0',
  qbwcUser: process.env.QBWC_USER ?? 'qbwc',
  qbwcPass: process.env.QBWC_PASS ?? 'secret',
  debugXml: process.env.DEBUG_QBXML === 'true', // 👈 controla logs de XML
  maxReturned: Number(process.env.QB_MAX_RETURNED ?? 50),
};