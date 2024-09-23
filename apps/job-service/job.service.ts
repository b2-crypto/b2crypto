import { BuildersService } from '@builder/builders';
import EventClientEnum from '@common/common/enums/EventsNameEnum';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesAffiliateEnum from 'apps/affiliate-service/src/enum/events.names.affiliate.enum';
import EventsNamesBrandEnum from 'apps/brand-service/src/enum/events.names.brand.enum';
import EventsNamesFileEnum from 'apps/file-service/src/enum/events.names.file.enum';
import EventsNamesLeadEnum from 'apps/lead-service/src/enum/events.names.lead.enum';
import EventsNamesPspEnum from 'apps/psp-service/src/enum/events.names.psp.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
const time = '0 */20 * * * *';
@Injectable()
export class JobService {
  static periodicTime = {
    sendBalanceCardReports: CronExpression.EVERY_DAY_AT_11AM,
    checkBalanceUser: CronExpression.EVERY_DAY_AT_5AM,
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
  sendBalanceCardReportsCron() {
    Logger.log('Sended reports', JobService.name);
    if (this.env == EnvironmentEnum.prod) {
      this.builder.emitAccountEventClient(
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
}
