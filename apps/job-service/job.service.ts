import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class JobService {
  static readonly periodicTime = {
    //sendBalanceCardReports: CronExpression.EVERY_DAY_AT_1PM,
    sendBalanceCardReports: '30 10 * * *',
    sweepOmnibus: CronExpression.EVERY_12_HOURS,
    checkBalanceUser: CronExpression.EVERY_DAY_AT_11AM,
    checkCardsInPomelo: '0 */6 * * * *',
    checkB2BinPayTransfers: CronExpression.EVERY_5_MINUTES,
    sendLast6hHistoryTransfer: CronExpression.EVERY_6_HOURS,
  };
  private env = 'DEV';

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    readonly configService: ConfigService,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
  ) {
    this.env = configService.get('ENVIRONMENT');
  }

  @Cron(JobService.periodicTime.sendLast6hHistoryTransfer, {
    timeZone: process.env.TZ,
  })
  async sendLast6hHistoryTransfer() {
    this.logger.debug(
      'Sended last 6h history transfer',
      `${this.env} - ${JobService.name}`,
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
    this.logger.debug(
      'Sended balance card report',
      `${this.env} - ${JobService.name}`,
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
    this.logger.debug(
      'Checked balance users',
      `${this.env} - ${JobService.name}`,
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
    this.logger.debug(
      'Checking Cards in pomelo',
      `${this.env} - ${JobService.name}`,
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
    this.logger.debug('Job sweep omibus', `${this.env} - ${JobService.name}`);
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
      'Disabled Job checkB2BinPayTransfers',
      `${this.env} - ${JobService.name}`,
    );
    // this.logger.debug(
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
}
