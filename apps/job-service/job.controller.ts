import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { Controller, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPattern } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApiTags } from '@nestjs/swagger';
import { EventsNamesOutboxEnum } from '@outbox/outbox/enums/events.names.outbox.enum';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
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
    @Inject(BuildersService)
    private readonly builder: BuildersService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS, {
    timeZone: process.env.TZ,
  })
  async sendOutboxReadyForPublish() {
    this.logger.info(`[sendOutboxReadyForPublish] Send ready for publish`);

    if (
      this.configService.get<string>('ENVIRONMENT') === EnvironmentEnum.prod
    ) {
      await this.builder.getPromiseOutboxEventClient<string>(
        EventsNamesOutboxEnum.sendOutboxReadyForPublish,
        '',
      );
    }
  }

  @EventPattern(EventsNamesOutboxEnum.sendOutboxReadyForPublish)
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
      await this.builder.getPromiseOutboxEventClient<string>(
        EventsNamesOutboxEnum.sendOutboxLagging,
        '',
      );
    }
  }

  @EventPattern(EventsNamesOutboxEnum.sendOutboxLagging)
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
      await this.builder.getPromiseOutboxEventClient<string>(
        EventsNamesOutboxEnum.removeOutbox,
        '',
      );
    }
  }

  @EventPattern(EventsNamesOutboxEnum.removeOutbox)
  async removedOutbox() {
    this.logger.info(`[removedOutbox] Removed outbox`);

    return this.jobService.removeOutbox();
  }
}
