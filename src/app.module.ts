import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QbwcModule } from './qbwc/qbwc.module';

@Module({
  imports: [QbwcModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
