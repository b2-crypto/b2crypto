import { BuildersService } from '@builder/builders';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';

@Injectable()
export class JobService {
  static readonly periodicTime = {
    //sendBalanceCardReports: CronExpression.EVERY_DAY_AT_1PM,
    sendBalanceCardReports: '30 10 * * *',
    checkBalanceUser: CronExpression.EVERY_DAY_AT_11AM,
    checkCardsInPomelo: '0 */6 * * * *',
    checkB2BinPayTransfers: '0 */5 * * * *',
  };
  private env = 'DEV';

  constructor(
    readonly configService: ConfigService,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
  ) {
    this.env = configService.get('ENVIRONMENT');
  }

  @Cron(JobService.periodicTime.sendBalanceCardReports, {
    timeZone: process.env.TZ,
  })
  async sendBalanceCardReportsCron() {
    Logger.log('Sended reports', JobService.name);
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
    Logger.log('Checked balance users', JobService.name);
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
}
