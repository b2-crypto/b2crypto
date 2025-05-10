import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxServiceMongooseService } from '@outbox/outbox';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { Cache } from 'cache-manager';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class JobService {
  static readonly periodicTime = {
    //sendBalanceCardReports: CronExpression.EVERY_DAY_AT_1PM,
    /**  */
    sendBalanceCardReports: '30 10 * * *',
    sweepOmnibus: CronExpression.EVERY_12_HOURS,
    checkBalanceUser: CronExpression.EVERY_DAY_AT_11AM,
    checkCardsInPomelo: '0 */8 * * * *',
    checkB2BinPayTransfers: CronExpression.EVERY_5_MINUTES,
    sendLast6hHistoryTransfer: CronExpression.EVERY_6_HOURS,
  };
  private env = 'DEV';

  constructor(
    @InjectPinoLogger(JobService.name)
    protected readonly logger: PinoLogger,
    readonly configService: ConfigService,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
    @Inject(OutboxServiceMongooseService)
    private readonly outboxService: OutboxServiceMongooseService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.env = configService.get('ENVIRONMENT');
  }

  async sendLast6hHistoryTransfer() {
    this.logger.info(
      `[sendLast6hHistoryTransfer] Sended last 6h history transfer: ${this.env} - ${JobService.name}`,
    );
    if (this.env == EnvironmentEnum.prod) {
      this.builder.emitTransferEventClient(
        EventsNamesTransferEnum.sendLast6hHistoryCardPurchases,
        0,
      );
      this.builder.emitTransferEventClient(
        EventsNamesTransferEnum.sendLast6hHistoryCardWalletDeposits,
        0,
      );
    }
  }

  @Cron(JobService.periodicTime.sendBalanceCardReports, {
    timeZone: process.env.TZ,
  })
  async sendBalanceCardReportsCron() {
    this.logger.info(
      `[sendBalanceCardReportsCron] Sended balance card report: ${this.env} - ${JobService.name}`,
    );
    if (this.env == EnvironmentEnum.prod) {
      await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.sendBalanceReport,
        {
          where: {
            type: 'CARD',
          },
        },
      );
    }
  }

  @Cron(JobService.periodicTime.checkBalanceUser, {
    timeZone: process.env.TZ,
  })
  checkBalanceUserCron() {
    this.logger.info(
      `[checkBalanceUserCron] Checked balance users: ${this.env} - ${JobService.name}`,
    );
    if (this.env == EnvironmentEnum.prod) {
      this.builder.emitUserEventClient(
        EventsNamesUserEnum.checkBalanceUser,
        '0',
      );
    }
  }

  @Cron(JobService.periodicTime.checkCardsInPomelo, {
    timeZone: process.env.TZ,
  })
  checkCardsInPomelo() {
    this.logger.info(
      `[checkCardsInPomelo] Checking Cards in pomelo: ${this.env} - ${JobService.name}`,
    );

    if (this.env === EnvironmentEnum.prod) {
      this.builder.emitAccountEventClient(
        EventsNamesAccountEnum.checkCardsCreatedInPomelo,
        'pomelo',
      );
    }
  }

  @Cron(JobService.periodicTime.checkB2BinPayTransfers, {
    timeZone: process.env.TZ,
  })
  sweepOmibus() {
    this.logger.info(
      `[sweepOmibus] Job sweep omibus: ${this.env} - ${JobService.name}`,
    );
    if (this.env === EnvironmentEnum.prod) {
      // this.builder.emitAccountEventClient(
      //   EventsNamesAccountEnum.sweepOmnibus,
      //   'omnibus',
      // );
    }
  }

  @Cron(JobService.periodicTime.checkB2BinPayTransfers, {
    timeZone: process.env.TZ,
  })
  checkB2BinPayTransfers() {
    this.logger.warn(
      `[checkB2BinPayTransfers] Disabled Job checkB2BinPayTransfers: ${this.env} - ${JobService.name}`,
    );
    // this.logger.info(
    //   'Checking B2BinPay transfers',
    //   `${this.env} - ${JobService.name}`,
    // );
    // if (this.env === EnvironmentEnum.prod) {
    //   this.builder.emitTransferEventClient(
    //     EventsNamesTransferEnum.checkTransferInB2BinPay,
    //     'b2binpay',
    //   );
    // }
  }

  async sendOutboxReadyForPublish() {
    this.logger.info(`[sendOutboxReadyForPublish] Send ready for publish`);

    const now = new Date();
    const processId = process.pid;
    const cacheKey = `outbox.ready.for.publish`;
    const outboxReadyForPublishRunningId = await this.cacheManager.get<number>(
      cacheKey,
    );

    try {
      if (outboxReadyForPublishRunningId) {
        this.logger.info(
          `[sendOutboxReadyForPublish] Already other process running in ${outboxReadyForPublishRunningId}`,
        );

        return;
      }

      await this.cacheManager.set(cacheKey, processId, 30 * 60 * 1000);

      const outboxes = await this.outboxService.findAll({
        where: {
          publishAfter: { $lte: now },
          isInOutbox: false,
          isPublished: false,
        },
        page: 1,
        take: 100,
      });

      this.logger.info(
        `[sendOutboxReadyForPublish] Outbox finded: ${outboxes.list.length}`,
      );

      const outboxIds = outboxes.list.map((outbox) => String(outbox._id));

      await this.outboxService.updateMany(outboxIds, [
        {
          isInOutbox: true,
        },
      ]);

      for (const outbox of outboxes.list) {
        await this.builder.getPromiseOutboxEventClient<string, void, string>(
          outbox.topic,
          outbox.jsonPayload,
        );

        await this.outboxService.update(outbox._id, {
          isPublished: true,
        });
      }

      await this.cacheManager.del(cacheKey);
    } catch (err) {
      this.logger.error(
        `[sendOutboxReadyForPublish] Error: ${err.message || err}`,
      );

      await this.cacheManager.del(cacheKey);

      throw err;
    }
  }

  async sendOutboxLagging() {
    this.logger.info(`[sendOutboxLagging] Send lagging`);

    const now = new Date();
    const processId = process.pid;
    const cacheKey = `outbox.lagging`;
    const outboxLaggingRunningId = await this.cacheManager.get<number>(
      cacheKey,
    );

    try {
      if (outboxLaggingRunningId) {
        this.logger.info(
          `[sendOutboxLagging] Already other process running in ${outboxLaggingRunningId}`,
        );

        return;
      }

      await this.cacheManager.set(cacheKey, processId, 30 * 60 * 1000);

      const outboxes = await this.outboxService.findAll({
        where: {
          publishAfter: { $lte: now },
          isInOutbox: true,
          isPublished: false,
        },
        page: 1,
        take: 100,
      });

      this.logger.info(
        `[sendOutboxLagging] Outbox finded: ${outboxes.list.length}`,
      );

      for (const outbox of outboxes.list) {
        await this.builder.getPromiseOutboxEventClient<string, void, string>(
          outbox.topic,
          outbox.jsonPayload,
        );

        await this.outboxService.update(outbox._id, {
          isPublished: true,
        });
      }

      await this.cacheManager.del(cacheKey);
    } catch (err) {
      this.logger.error(`[sendOutboxLagging] Error: ${err.message || err}`);

      await this.cacheManager.del(cacheKey);

      throw err;
    }
  }

  async removeOutbox() {
    this.logger.info(`[removeOutbox] Remove outbox`);

    const processId = process.pid;
    const cacheKey = `outbox.remove`;
    const outboxRemoveRunningId = await this.cacheManager.get<number>(cacheKey);

    try {
      if (outboxRemoveRunningId) {
        this.logger.info(
          `[removeOutbox] Already other process running in ${outboxRemoveRunningId}`,
        );

        return;
      }

      await this.cacheManager.set(cacheKey, processId, 30 * 60 * 1000);

      await this.outboxService.removeAllData({
        where: {
          isInOutbox: true,
          isPublished: true,
        },
      });

      await this.cacheManager.del(cacheKey);
    } catch (err) {
      this.logger.error(`[removeOutbox] Error: ${err.message || err}`);

      await this.cacheManager.del(cacheKey);

      throw err;
    }
  }
}
