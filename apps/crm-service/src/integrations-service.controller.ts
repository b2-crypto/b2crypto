import {
  Body,
  Controller,
  NotFoundException,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { CrmServiceController } from './crm-service.controller';
import { isDate } from 'class-validator';
import { MaintenanceOnDto } from '@user/user/dto/maintenance.on.dto';

@ApiTags('INTEGRATIONS')
@Controller('integrations')
export class IntegrationsServiceController extends CrmServiceController {
  @Put('maintenance-on')
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  async maintenanceOn(
    @Req() req,
    @Body()
    maintenanceOnDto: MaintenanceOnDto,
  ) {
    const clientId = req.client;
    if (!clientId) {
      throw new NotFoundException('Client not found');
    }
    maintenanceOnDto.dateStart = maintenanceOnDto.dateStart ?? new Date();
    if (
      maintenanceOnDto.dateEnd.getTime() < maintenanceOnDto.dateStart.getTime()
    ) {
      throw new NotFoundException(
        `End date (${maintenanceOnDto.dateEnd.toISOString()}) must be greater than Start date (${maintenanceOnDto.dateStart.toISOString()})`,
      );
    }
    this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, {
      id: clientId,
      inMaintenance: true,
      maintenanceEndAt: maintenanceOnDto.dateEnd,
      maintenanceStartAt: maintenanceOnDto.dateStart,
    });
    return {
      statusCode: 200,
      message: 'Maintenance status active',
    };
  }

  @Put('maintenance-off')
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  async maintenanceOff(@Req() req) {
    const clientId = req.client;
    if (!clientId) {
      throw new NotFoundException('Client not found');
    }
    this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, {
      id: clientId,
      inMaintenance: false,
      maintenanceEndAt: null,
      maintenanceStartAt: null,
    });
    return {
      statusCode: 200,
      message: 'Maintenance status inactive',
    };
  }
}
