import { BuildersService } from '@builder/builders';
import EventClientEnum from '@common/common/enums/EventsNameEnum';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import EventsNamesAffiliateEnum from 'apps/affiliate-service/src/enum/events.names.affiliate.enum';
import EventsNamesBrandEnum from 'apps/brand-service/src/enum/events.names.brand.enum';
import EventsNamesFileEnum from 'apps/file-service/src/enum/events.names.file.enum';
import EventsNamesLeadEnum from 'apps/lead-service/src/enum/events.names.lead.enum';
import EventsNamesPspEnum from 'apps/psp-service/src/enum/events.names.psp.enum';
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
  checkFilesDownloadsCron() {
    Logger.log('Checking Files created to downloads', JobService.name);
  }

  @Cron(JobService.periodicTime.checkLeadCreated, {
    timeZone: process.env.TZ,
  })
  checkLeadCreatedInCrmCron() {
    Logger.log('Checking Lead created in CRM', JobService.name);
  }

  @Cron(JobService.periodicTime.checkLeadStatus, {
    timeZone: process.env.TZ,
  })
  checkLeadStatusInCrmCron() {
    Logger.log('Checking Lead status in CRM', JobService.name);
  }

  @Cron(JobService.periodicTime.checkAffiliateLeadsStats, {
    timeZone: process.env.TZ,
  })
  checkAffiliateLeadsStatsCron() {
    Logger.log('Checking Affiliate leads stats', JobService.name);
  }

  @Cron(JobService.periodicTime.checkAffiliateStats, {
    timeZone: process.env.TZ,
  })
  checkAffiliateStatsCron() {
    Logger.log('Checking Affiliate leads stats', JobService.name);
  }

  @Cron(JobService.periodicTime.checkBrandLeadsStats, {
    timeZone: process.env.TZ,
  })
  checkBrandStatsCron() {
    Logger.log('Checking Brand leads stats', JobService.name);
  }

  @Cron(JobService.periodicTime.checkCrmLeadsStats, {
    timeZone: process.env.TZ,
  })
  checkCrmStatsCron() {
    Logger.log('Checking Crm leads stats', JobService.name);
  }

  @Cron(JobService.periodicTime.checkPspAccountLeadsStats, {
    timeZone: process.env.TZ,
  })
  checkPspAccountStatsCron() {
    Logger.log('Checking Psp Account leads stats', JobService.name);
  }

  @Cron(JobService.periodicTime.checkPspLeadsStats, {
    timeZone: process.env.TZ,
  })
  checkPspStatsCron() {
    Logger.log('Checking Psp leads stats', JobService.name);
  }
  @Cron(JobService.periodicTime.checkCashierStatus, {
    timeZone: process.env.TZ,
  })
  checkCashierStatusCron() {
    Logger.log('Checking cashier status', JobService.name);
  }
  @Cron(JobService.periodicTime.checkCashierBrands, {
    timeZone: process.env.TZ,
  })
  checkCashierBrandsCron() {
    Logger.log('Checking cashier brands', JobService.name);
  }
  @Cron(JobService.periodicTime.checkCashierPsps, {
    timeZone: process.env.TZ,
  })
  checkCashierPspsCron() {
    Logger.log('Checking cashier psps', JobService.name);
  }
}
