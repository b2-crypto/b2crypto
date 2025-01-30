import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('/')
export class AppController {
  @AllowAnon()
  @HttpCode(HttpStatus.OK)
  @Get('/health')
  getHealth() {
    return { statusCode: 200, message: 'OK' };
  }
}
