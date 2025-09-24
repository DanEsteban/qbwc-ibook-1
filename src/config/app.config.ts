import * as dotenv from 'dotenv';
dotenv.config();

export const AppConfig = {
  port: Number(process.env.PORT ?? 3000),
  qbwcUser: process.env.QBWC_USER ?? 'qbwc-user',
  qbwcPass: process.env.QBWC_PASS ?? 'password123',
  exportDir: process.env.EXPORT_DIR ?? './exports',
  qbxmlVersion: process.env.QBXML_VERSION ?? '13.0',
  maxReturned: Number(process.env.MAX_RETURNED ?? 50),
  baseUrl: process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,

  // Destino HTTP
  targetApiBase: process.env.TARGET_API_BASE ?? 'http://localhost:4000',
  targetApiKey: process.env.TARGET_API_KEY ?? '',
  targetApiSecret: process.env.TARGET_API_SECRET ?? '',
};
