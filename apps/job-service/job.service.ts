import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import EventClientEnum from '@common/common/enums/EventsNameEnum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxServiceMongooseService } from '@outbox/outbox';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { Cache } from 'cache-manager';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { lastValueFrom } from 'rxjs';

@Traceable()
@Injectable()
export class JobService {
  static readonly periodicTime = {
    //sendBalanceCardReports: CronExpression.EVERY_DAY_AT_1PM,
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
    @Inject(EventClientEnum.OUTBOX) private readonly brokerService: ClientProxy,
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
    const nowSeconds = now.getSeconds();
    const newSeconds =
      nowSeconds >= 0 && nowSeconds < 10
        ? 0
        : nowSeconds >= 10 && nowSeconds < 20
        ? 10
        : nowSeconds >= 20 && nowSeconds < 30
        ? 20
        : nowSeconds >= 30 && nowSeconds < 40
        ? 30
        : nowSeconds >= 40 && nowSeconds < 50
        ? 40
        : nowSeconds >= 50 && nowSeconds < 60
        ? 50
        : 0;

    now.setSeconds(newSeconds);
    now.setMilliseconds(0);

    const cacheKey = `outbox.ready.for.publish.${now.toISOString()}`;
    const isOutboxReadyForPublishRunning = await this.cacheManager.get<boolean>(
      cacheKey,
    );

    if (isOutboxReadyForPublishRunning) return;

    await this.cacheManager.set(cacheKey, true, 60 * 1000);

    const outboxes = await this.outboxService.findAll({
      where: {
        publishAfter: { $lte: now },
        isInOutbox: false,
        isPublished: false,
      },
      page: 1,
      take: 100,
    });

    const outboxIds = outboxes.list.map((outbox) => String(outbox._id));

    if (outboxIds.length == 0) return;

    await this.outboxService.updateMany(outboxIds, [
      {
        isInOutbox: true,
      },
    ]);

    for (const outbox of outboxes.list) {
      await lastValueFrom(
        this.brokerService.emit(outbox.topic, outbox.jsonPayload),
      );

      await this.outboxService.update(outbox._id, {
        isPublished: true,
      });
    }
  }

  async sendOutboxLagging() {
    this.logger.info(`[sendOutboxLagging] Send lagging`);

    const now = new Date();

    now.setSeconds(0);
    now.setMilliseconds(0);

    const cacheKey = `outbox.lagging.${now.toISOString()}`;
    const isOutboxLaggingRunning = await this.cacheManager.get<boolean>(
      cacheKey,
    );

    if (isOutboxLaggingRunning) return;

    await this.cacheManager.set(cacheKey, true, 60 * 1000);

    const outboxes = await this.outboxService.findAll({
      where: {
        publishAfter: { $lte: new Date(now.getTime() - 5 * 60 * 1000) },
        isInOutbox: true,
        isPublished: false,
      },
      page: 1,
      take: 100,
    });

    for (const outbox of outboxes.list) {
      await lastValueFrom(
        this.brokerService.emit(outbox.topic, outbox.jsonPayload),
      );

      await this.outboxService.update(outbox._id, {
        isPublished: true,
      });
    }
  }

  async removeOutbox() {
    this.logger.info(`[removeOutbox] Remove outbox`);

    const now = new Date();

    now.setSeconds(0);
    now.setMilliseconds(0);

    const cacheKey = `outbox.remove.${now.toISOString()}`;
    const isOutboxLaggingRunning = await this.cacheManager.get<boolean>(
      cacheKey,
    );

    if (isOutboxLaggingRunning) return;

    await this.cacheManager.set(cacheKey, true, 60 * 1000);

    await this.outboxService.removeAllData({
      where: {
        isInOutbox: true,
        isPublished: true,
      },
    });
  }
}
