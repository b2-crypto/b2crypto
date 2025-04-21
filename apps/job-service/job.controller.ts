import { Traceable } from '@amplication/opentelemetry-nestjs';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import EventClientEnum from '@common/common/enums/EventsNameEnum';
import { Controller, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, EventPattern } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApiTags } from '@nestjs/swagger';
import { OutboxEvents } from '@outbox/outbox/enums/outbox.events';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { lastValueFrom } from 'rxjs';
import { JobService } from './job.service';

@ApiTags('JOBS')
@Traceable()
@Controller('job')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly configService: ConfigService,
    @InjectPinoLogger(JobController.name)
    private readonly logger: PinoLogger,
    @Inject(EventClientEnum.OUTBOX) private readonly brokerService: ClientProxy,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS, {
    timeZone: process.env.TZ,
  })
  async sendOutboxReadyForPublish() {
    this.logger.info(`[sendOutboxReadyForPublish] Send ready for publish`);

    if (
      this.configService.get<string>('ENVIRONMENT') === EnvironmentEnum.prod
    ) {
      await lastValueFrom(
        this.brokerService.emit(OutboxEvents.sendOutboxReadyForPublish, ''),
      );
    }
  }

  @EventPattern(OutboxEvents.sendOutboxReadyForPublish)
  async sendedOutboxReadyForPublish() {
    this.logger.info(`[sendedOutboxReadyForPublish] Sended ready for publish`);

    return this.jobService.sendOutboxReadyForPublish();
  }

  @Cron(CronExpression.EVERY_5_MINUTES, {
    timeZone: process.env.TZ,
  })
  async sendOutboxLagging() {
    this.logger.info(`[sendOutboxLagging] Send lagging`);

    if (
      this.configService.get<string>('ENVIRONMENT') === EnvironmentEnum.prod
    ) {
      await lastValueFrom(
        this.brokerService.emit(OutboxEvents.sendOutboxLagging, ''),
      );
    }
  }

  @EventPattern(OutboxEvents.sendOutboxLagging)
  async sendedOutboxLagging() {
    this.logger.info(`[sendedOutboxLagging] Sended lagging`);

    return this.jobService.sendOutboxLagging();
  }

  @Cron(CronExpression.EVERY_5_MINUTES, {
    timeZone: process.env.TZ,
  })
  async removeOutbox() {
    this.logger.info(`[removeOutbox] Remove outbox`);

    if (
      this.configService.get<string>('ENVIRONMENT') === EnvironmentEnum.prod
    ) {
      await lastValueFrom(
        this.brokerService.emit(OutboxEvents.removeOutbox, ''),
      );
    }
  }

  @EventPattern(OutboxEvents.removeOutbox)
  async removedOutbox() {
    this.logger.info(`[removedOutbox] Removed outbox`);

    return this.jobService.removeOutbox();
  }
}
