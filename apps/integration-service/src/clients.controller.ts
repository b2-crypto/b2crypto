import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { BuildersService } from '@builder/builders';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';

@Controller('clients')
@UseGuards(ApiKeyAuthGuard)
export class ClientsIntegrationController {
  constructor(private readonly builder: BuildersService) {}

  @Get('me')
  @ApiKeyCheck()
  async getClientData(@Req() req) {
    const clientApi = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.findOneById,
      req.clientApi,
    );
    return clientApi;
  }
}
