import 'reflect-metadata';
import * as soap from 'soap';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';
import { getWSDL } from './qbwc/qbwc.wsdl';
import { JobQueue } from './queue/job-queue';
import { qbwcServiceFactory } from './qbwc/qbwc.soap';
import { HttpDocSink } from './sink/http-doc-sink';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const server = app.getHttpAdapter().getInstance();
  //(Web Services Description Language)
  const wsdlXml = getWSDL(); 

  const sink = new HttpDocSink();
  const jobQueue = new JobQueue(sink);
  const service = qbwcServiceFactory(jobQueue);

  await new Promise<void>((resolve, reject) => {
    try {
      soap.listen(server, '/qbwc', service, wsdlXml, (err: any) => {
        if (err) {
          console.error('❌ Error configurando SOAP:', err);
          reject(err);
        } else {
          console.log('✅ Servicio SOAP configurado correctamente');
          resolve();
        }
      });
    } catch (error) {
      console.error('❌ Error en soap.listen:', error);
      reject(error);
    }
  });

  await app.listen(AppConfig.port);

  console.log('======================================');
  console.log(`🚀 Aplicación iniciada en: ${AppConfig.baseUrl}`);
  console.log(`🚀 SOAP: ${AppConfig.baseUrl}/qbwc  |  WSDL: ${AppConfig.baseUrl}/qbwc?wsdl`);
  console.log(`🎯 Target API: ${AppConfig.targetApiBase}`);
  console.log('======================================');
}
bootstrap().catch((err) => {
  console.error('💥 Error al iniciar:', err);
  process.exit(1);
});
