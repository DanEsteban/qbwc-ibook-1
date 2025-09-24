import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  health() {
    return { ok: true, service: 'IBOOK-QB', now: new Date().toISOString() };
  }
  
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
