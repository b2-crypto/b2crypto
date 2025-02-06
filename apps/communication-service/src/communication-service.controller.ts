import { Traceable } from '@amplication/opentelemetry-nestjs';
import { Controller, Get } from '@nestjs/common';
import { CommunicationServiceService } from './communication-service.service';

@Traceable()
@Controller()
export class CommunicationServiceController {
  constructor(
    private readonly communicationServiceService: CommunicationServiceService,
  ) {}

  @Get()
  getHello(): string {
    return this.communicationServiceService.getHello();
  }
}
