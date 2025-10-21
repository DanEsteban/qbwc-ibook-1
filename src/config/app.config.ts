import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.COMPANY_ID) {
  throw new Error('❌ COMPANY_ID is required in environment variables');
}

if (!process.env.TARGET_API_KEY) {
  throw new Error('❌ TARGET_API_KEY is required in environment variables');
}

export const AppConfig = {
  port: Number(process.env.PORT ?? 3005),
  qbwcUser: process.env.QBWC_USER ?? 'qbwc-user',
  qbwcPass: process.env.QBWC_PASS ?? 'password123',
  exportDir: process.env.EXPORT_DIR ?? './exports',
  qbxmlVersion: process.env.QBXML_VERSION ?? '13.0',
  maxReturned: Number(process.env.MAX_RETURNED ?? 50),
  baseUrl: process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3005}`,
  companyId: process.env.COMPANY_ID,
  targetApiBase: process.env.TARGET_API_BASE ?? 'http://localhost:3001',
  targetApiKey: process.env.TARGET_API_KEY,
  targetApiSecret: process.env.TARGET_API_SECRET ?? '',
};
