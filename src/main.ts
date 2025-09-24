import 'reflect-metadata';
import * as soap from 'soap';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';
import { getWSDL } from './qbwc/qbwc.wsdl';
import { HttpSink } from './sink/http-sink';
import { JobQueue } from './queue/job-queue';
import { qbwcServiceFactory } from './qbwc/qbwc.soap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const server = app.getHttpAdapter().getInstance();
  const wsdlXml = getWSDL();
  console.log('🔧 WSDL generated with URL:', AppConfig.baseUrl);

  // Nuevo: Sink HTTP + JobQueue con Sink
  const sink = new HttpSink();
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
  console.log(`📡 QBWC endpoint: ${AppConfig.baseUrl}/qbwc`);
  console.log(`📄 WSDL: ${AppConfig.baseUrl}/qbwc?wsdl`);
  console.log(`🎯 Target API: ${AppConfig.targetApiBase}`);
  console.log(`📋 Credenciales: user=${AppConfig.qbwcUser}`);
  console.log('======================================');
}
bootstrap().catch((err) => {
  console.error('💥 Error al iniciar:', err);
  process.exit(1);
});
