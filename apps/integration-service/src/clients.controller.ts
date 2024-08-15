import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { MaintenanceOnDto } from '@user/user/dto/maintenance.on.dto';
import EventsNamesLeadEnum from 'apps/lead-service/src/enum/events.names.lead.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { resolve } from 'dns';
import { ClientsTaskNamesEnum } from './enums/clients.task.names.enum';

@Controller('clients')
@UseGuards(ApiKeyAuthGuard)
export class ClientsIntegrationController {
  constructor(
    private readonly builder: BuildersService,
    @Inject(SchedulerRegistry)
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  @Get('me')
  @ApiKeyCheck()
  async getClientData(@Req() req) {
    const clientApi = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.findOneById,
      req.clientApi,
    );
    return clientApi;
  }

  @Put('maintenance-on')
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  async maintenanceOn(
    @Req() req,
    @Body()
    maintenanceOnDto: MaintenanceOnDto,
  ) {
    const clientId = req.clientApi;
    if (!clientId) {
      throw new NotFoundException('Client not found');
    }
    const now = new Date();
    maintenanceOnDto.dateStart = maintenanceOnDto.dateStart ?? now;
    if (
      maintenanceOnDto.dateEnd?.getTime() < maintenanceOnDto.dateStart.getTime()
    ) {
      throw new NotFoundException(
        `End date (${maintenanceOnDto.dateEnd.toISOString()}) must be greater than Start date (${maintenanceOnDto.dateStart.toISOString()})`,
      );
    }
    if (maintenanceOnDto.dateEnd) {
      if (now.getTime() >= maintenanceOnDto.dateEnd.getTime()) {
        throw new NotFoundException(
          `End date (${maintenanceOnDto.dateEnd.toISOString()}) must be greater than now (${now.toISOString()})`,
        );
      }
      Logger.log(
        `Programming to ${maintenanceOnDto.dateEnd}`,
        'maintenance off',
      );
      this.clearTimeoutScheduler(this.getTaskOffName(clientId));
      CommonService.addTimeout(
        this.schedulerRegistry,
        this.getTaskOffName(clientId),
        maintenanceOnDto.dateEnd.getTime() - now.getTime(),
        async () => {
          Logger.log('maintenance off', `Client ${clientId}`);
          this.cancelMaintenance(clientId);
        },
      );
    }
    const inMaintenance = now.getTime() >= maintenanceOnDto.dateStart.getTime();
    if (!inMaintenance) {
      Logger.log(
        `Programming to ${maintenanceOnDto.dateStart}`,
        'maintenance on',
      );
      this.clearTimeoutScheduler(this.getTaskOnName(clientId));
      CommonService.addTimeout(
        this.schedulerRegistry,
        this.getTaskOnName(clientId),
        maintenanceOnDto.dateStart.getTime() - now.getTime(),
        async () => {
          Logger.log('maintenance on', `Client ${clientId}`);
          this.initMaintenance(clientId, true);
        },
      );
    }
    this.initMaintenance(
      clientId,
      inMaintenance,
      maintenanceOnDto.dateStart,
      maintenanceOnDto.dateEnd,
    );
    return {
      statusCode: 200,
      message: 'Maintenance status active',
    };
  }

  @Put('maintenance-off')
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  async maintenanceOff(@Req() req) {
    const clientId = req.clientApi;
    if (!clientId) {
      throw new NotFoundException('Client not found');
    }
    this.clearTimeoutScheduler(this.getTaskOnName(clientId));
    this.clearTimeoutScheduler(this.getTaskOffName(clientId));
    this.cancelMaintenance(clientId);
    return {
      statusCode: 200,
      message: 'Maintenance status inactive',
    };
  }

  private getTaskOnName(clientId) {
    return `${ClientsTaskNamesEnum.MAINTENANCE_ON}_${clientId}`;
  }

  private getTaskOffName(clientId) {
    return `${ClientsTaskNamesEnum.MAINTENANCE_OFF}_${clientId}`;
  }

  private cancelMaintenance(clientId) {
    this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, {
      id: clientId,
      inMaintenance: false,
      maintenanceEndAt: null,
      maintenanceStartAt: null,
    });
  }

  private initMaintenance(
    clientId,
    inMaintenance: boolean,
    dateStart = null,
    dateEnd = null,
  ) {
    const data = {
      id: clientId,
      inMaintenance: inMaintenance,
    };
    if (dateStart) {
      data['maintenanceStartAt'] = dateStart;
    }
    if (dateEnd) {
      data['maintenanceEndAt'] = dateEnd;
    }
    this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, data);
  }

  private clearTimeoutScheduler(taskName: string) {
    try {
      const task = this.schedulerRegistry.getTimeout(taskName);
      clearTimeout(task);
      Logger.log('cleared', `Task "${taskName}" schedulerRegistry`);
    } catch (err) {
      Logger.error(err, `Task "${taskName}" schedulerRegistry`);
    }
  }
}
