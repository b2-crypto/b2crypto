import { BuildersService } from '@builder/builders';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import EventsNamesAccountEnum from '../account-service/src/enum/events.names.account.enum';
const time = '0 */20 * * * *';
@Injectable()
export class JobService {
  static periodicTime = {
    checkLeadCreated: CronExpression.EVERY_10_MINUTES,
    checkLeadStatus: CronExpression.EVERY_5_MINUTES,
    checkCardsInPomelo: '0 */6 * * * *',
    checkB2BinPayTransfers: '0 */5 * * * *',
    //checkLeadStatus: time,
    //checkAffiliateLeadsStats: time,
    /*
    checkBrandLeadsStats: time,
    checkCrmLeadsStats: time,
    checkPspAccountLeadsStats: time,
    checkPspLeadsStats: time, */
    checkAffiliateLeadsStats: CronExpression.EVERY_DAY_AT_MIDNIGHT,
    checkAffiliateStats: CronExpression.EVERY_HOUR,
    checkBrandLeadsStats: CronExpression.EVERY_DAY_AT_1AM,
    checkCrmLeadsStats: CronExpression.EVERY_DAY_AT_2AM,
    checkPspAccountLeadsStats: CronExpression.EVERY_DAY_AT_3AM,
    checkPspLeadsStats: CronExpression.EVERY_DAY_AT_4AM,

    checkLeadPayment: CronExpression.EVERY_5_SECONDS,
    checkAffiliatesStats: CronExpression.EVERY_5_SECONDS,
    checkCrmStats: CronExpression.EVERY_5_SECONDS,
    checkBrandStats: CronExpression.EVERY_5_SECONDS,
    checkPspStats: CronExpression.EVERY_5_SECONDS,
    checkPspAccountStats: CronExpression.EVERY_5_SECONDS,
    checkCashierStatus: CronExpression.EVERY_10_MINUTES,
    checkCashierBrands: CronExpression.EVERY_4_HOURS,
    checkCashierPsps: CronExpression.EVERY_4_HOURS,
    checkFilesDownloads: CronExpression.EVERY_30_MINUTES,
  };
  private env = 'DEV';

  constructor(
    readonly configService: ConfigService,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
  ) {
    this.env = configService.get('ENVIRONMENT');
  }

  @Cron(JobService.periodicTime.checkCardsInPomelo, {
    timeZone: process.env.TZ,
  })
  checkCardsInPomelo() {
    if (this.env === EnvironmentEnum.prod) {
      this.builder.emitAccountEventClient(
        EventsNamesAccountEnum.checkCardsCreatedInPomelo,
        'pomelo',
      );
    } else {
      Logger.log('Checking Cards in pomelo', JobService.name);
    }
  }

  @Cron(JobService.periodicTime.checkB2BinPayTransfers, {
    timeZone: process.env.TZ,
  })
  checkB2BinPayTransfers() {
    if (this.env === EnvironmentEnum.prod) {
      this.builder.emitTransferEventClient(
        EventsNamesTransferEnum.checkTransferInB2BinPay,
        'b2binpay',
      );
    } else {
      Logger.log('Checking B2BinPay transfers', JobService.name);
    }
  }

  @Cron(JobService.periodicTime.checkFilesDownloads, {
    timeZone: process.env.TZ,
  })
  async sendLast6hHistoryTransfer() {
    Logger.log(
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
    Logger.log(
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
    Logger.log('Checked balance users', `${this.env} - ${JobService.name}`);
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
    Logger.log('Checking Cards in pomelo', `${this.env} - ${JobService.name}`);
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
    Logger.log('Job sweep omibus', `${this.env} - ${JobService.name}`);
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
    Logger.warn(
      'Disabled Job checkB2BinPayTransfers',
      `${this.env} - ${JobService.name}`,
    );
    // Logger.log(
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
