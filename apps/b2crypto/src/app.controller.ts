import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @AllowAnon()
  @Get('health')
  getHealth() {
    return { status: 'OK' };
  }
}
