import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('/')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @AllowAnon()
  @HttpCode(HttpStatus.OK)
  @Get('/health')
  getHealth() {
    return { statusCode: 200, message: 'OK' };
  }
}
