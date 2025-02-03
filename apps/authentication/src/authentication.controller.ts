import { Traceable } from '@amplication/opentelemetry-nestjs';
import { Controller, Get } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';

@Traceable()
@Controller()
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Get()
  getHello(): string {
    return this.authenticationService.getHello();
  }
}
