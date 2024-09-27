import { NoCache } from '@common/common/decorators/no-cache.decorator';
import { SecurityServiceService } from './security-service.service';
import { Controller, Get } from '@nestjs/common';

@Controller()
export class SecurityServiceController {
  constructor(
    private readonly securityServiceService: SecurityServiceService,
  ) {}

  @NoCache()
  @Get()
  getHello(): string {
    return this.securityServiceService.getHello();
  }
}
