import { Traceable } from '@amplication/opentelemetry-nestjs';
import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Traceable()
@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @AllowAnon()
  @HttpCode(HttpStatus.OK)
  @Get('/health')
  getHealth() {
    return { statusCode: 200, message: 'OK' };
  }
}
