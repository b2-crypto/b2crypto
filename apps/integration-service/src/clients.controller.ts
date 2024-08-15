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
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
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
  async getClientData(@Req() req) {
    const clientApi = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.findOneById,
      req.clientApi,
    );
    return {
      id: clientApi._id,
      email: clientApi.email,
      name: clientApi.name,
      active: clientApi.active,
      apiKey: clientApi.apiKey,
      authorizations: clientApi.authorizations,
      permissions: clientApi.permissions,
      createdAt: clientApi.createdAt,
      updatedAt: clientApi.updatedAt,
      inMaintenance: clientApi.inMaintenance,
      maintenanceEndAt: clientApi.maintenanceEndAt,
      maintenanceStartAt: clientApi.maintenanceStartAt,
    };
  }

  @Put('maintenance-on')
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
      const taskName = this.getTaskOffName(clientId);
      CommonService.removeTimeout(this.schedulerRegistry, taskName);
      Logger.log(
        `Programming to ${maintenanceOnDto.dateEnd}`,
        'maintenance off',
      );
      CommonService.addTimeout(
        this.schedulerRegistry,
        taskName,
        maintenanceOnDto.dateEnd.getTime() - now.getTime(),
        async () => {
          Logger.log('maintenance off', `Client ${clientId}`);
          this.cancelMaintenance(clientId);
        },
      );
    }
    const inMaintenance = now.getTime() >= maintenanceOnDto.dateStart.getTime();
    if (!inMaintenance) {
      const taskName = this.getTaskOnName(clientId);
      CommonService.removeTimeout(this.schedulerRegistry, taskName);
      Logger.log(
        `Programming to ${maintenanceOnDto.dateStart}`,
        'maintenance on',
      );
      CommonService.addTimeout(
        this.schedulerRegistry,
        taskName,
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
  async maintenanceOff(@Req() req) {
    const clientId = req.clientApi;
    if (!clientId) {
      throw new NotFoundException('Client not found');
    }
    CommonService.removeTimeout(
      this.schedulerRegistry,
      this.getTaskOnName(clientId),
    );
    CommonService.removeTimeout(
      this.schedulerRegistry,
      this.getTaskOffName(clientId),
    );
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
}
