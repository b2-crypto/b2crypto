import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { CommonService } from '@common/common';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { LeadDocument } from '@lead/lead/entities/mongoose/lead.schema';
import {
  Controller,
  Get,
  Inject,
  Logger,
  NotImplementedException,
  Param,
} from '@nestjs/common';
import {
  Query,
  Req,
} from '@nestjs/common/decorators/http/route-params.decorator';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { StatsDateCreateDto } from '@stats/stats/dto/stats.date.create.dto';
import { StatsDateAffiliateDocument } from '@stats/stats/entities/mongoose/stats.date.affiliate.schema';
import { TransferDocument } from '@transfer/transfer/entities/mongoose/transfer.schema';
import EventsNamesStatsEnum from './enum/events.names.stats.enum';
import { StatsServiceService } from './stats-service.service';
import EventsNamesAffiliateEnum from 'apps/affiliate-service/src/enum/events.names.affiliate.enum';
import { BuildersService } from '@builder/builders';
import ActionsEnum from '@common/common/enums/ActionEnum';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import { NoCache } from '@common/common/decorators/no-cache.decorator';

@Controller('stats')
export class StatsServiceController {
  constructor(
    private readonly statsServiceService: StatsServiceService,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
  ) {}

  @NoCache()
  @Get()
  async checkStatsDateAll(@Query() query?: QuerySearchAnyDto) {
    return this.statsServiceService.checkStatsDateAll(query);
  }

  @NoCache()
  @Get('transfer')
  async getStatsTransfer(/* @Query() query: QuerySearchAnyDto */) {
    return this.statsServiceService.getStatsTransfer(/* query */);
  }

  @NoCache()
  @Get('affiliates/global')
  async getStatsAffiliate(@Query() query: QuerySearchAnyDto, @Req() req?) {
    query = await this.filterFromUserPermissions(query, req);
    return this.statsServiceService.getGlobalStatDailyDBAffiliate(
      query,
      query.where?.department,
    );
  }

  @NoCache()
  @Get('psp-accounts/global')
  async getStatsPspAccount(@Query() query: QuerySearchAnyDto, @Req() req?) {
    query = await this.filterFromUserPermissions(query, req);
    return this.statsServiceService.getGlobalStatDailyDBPspAccount(query);
  }

  @NoCache()
  @Get('retention')
  async getStatsDateRetention(@Query() query?: QuerySearchAnyDto, @Req() req?) {
    query = await this.filterFromUserPermissions(query, req);
    return this.statsServiceService.getStatsDateRetention(query);
  }

  @NoCache()
  @Get('affiliates')
  async getStatsDateAffiliates(
    @Query() query?: QuerySearchAnyDto,
    @Req() req?,
  ) {
    query = await this.filterFromUserPermissions(query, req);
    return this.statsServiceService.getStatsDateAffiliates(
      query,
      query.where?.department,
    );
  }

  @NoCache()
  @Get('affiliates/:affiliateId')
  async getStatsDateAffiliate(@Param('affiliateId') affiliateId: string) {
    return this.statsServiceService.getStatsDateAffiliate(affiliateId);
  }

  @NoCache()
  @Get('psp-accounts')
  async getStatsDatePspAccounts(
    @Query() query?: QuerySearchAnyDto,
    @Req() req?,
  ) {
    query = await this.filterFromUserPermissions(query, req);
    return this.statsServiceService.getStatsDatePspAccounts(
      query,
      query.where?.department,
    );
  }

  @NoCache()
  @Get('psp-accounts/:pspAccountId')
  async getStatsDatePspAccount(@Param('pspAccountId') pspAccountId: string) {
    return this.statsServiceService.getStatsDatePspAccount(pspAccountId);
  }

  @NoCache()
  @Get('brands')
  async getStatsDateBrands(@Query() query?: QuerySearchAnyDto) {
    throw new NotImplementedException();
  }

  @NoCache()
  @Get('brands/:brandId')
  async getStatsDateBrand(@Param('brandId') brandId: string) {
    throw new NotImplementedException();
  }

  @NoCache()
  @Get('crms')
  async getStatsDateCrms(@Query() query?: QuerySearchAnyDto) {
    throw new NotImplementedException();
  }

  @NoCache()
  @Get('crms/:crmId')
  async getStatsDateCrm(@Param('crmId') crmId: string) {
    throw new NotImplementedException();
  }

  @NoCache()
  @Get('psps')
  async getStatsDatePsps(@Query() query?: QuerySearchAnyDto) {
    throw new NotImplementedException();
  }

  @NoCache()
  @Get('psps/:pspId')
  async getStatsDatePsp(@Param('pspId') pspId: string) {
    throw new NotImplementedException();
  }

  @AllowAnon()
  @EventPattern(EventsNamesStatsEnum.checkStatsAffiliate)
  async checkStatsAffiliate(
    @Payload() lead: LeadDocument,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    this.statsServiceService.checkStatsDateAffiliate(lead);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesStatsEnum.checkAllStatsAffiliate)
  async checkAllStatsAffiliate(
    @Payload()
    checkAllDto: {
      list: Array<LeadDocument>;
    },
    @Ctx() ctx: RmqContext,
  ): Promise<Array<StatsDateAffiliateDocument>> {
    CommonService.ack(ctx);
    const rta = await this.statsServiceService.checkAllStatsDateAffiliate(
      checkAllDto.list,
    );
    return rta;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesStatsEnum.removeAllStatsAffiliate)
  async removeAllStatsAffiliate(
    @Payload() query: JSON,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.statsServiceService.removeAllStatsDateAffiliate(query);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesStatsEnum.checkAllStatsPspAccount)
  async checkAllStatsPspAccount(
    @Payload()
    checkAllDto: {
      list: Array<TransferDocument>;
    },
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.statsServiceService.checkAllStatsDatePspAccount(
      checkAllDto.list,
    );
  }

  @AllowAnon()
  @MessagePattern(EventsNamesStatsEnum.removeAllStatsPspAccount)
  async removeAllStatsPspAccount(
    @Payload() query: JSON,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.statsServiceService.removeAllStatsDatePspAccount(query);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesStatsEnum.createStat)
  async removeAllStatsPsp(
    @Payload() statCreate: StatsDateCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.statsServiceService.createStat(statCreate);
  }

  @AllowAnon()
  @EventPattern(EventsNamesStatsEnum.checkStatsPsp)
  async checkStatsPspEvent(
    @Payload() transfer: TransferDocument,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    this.statsServiceService.checkStatsPsp(transfer);
  }

  @AllowAnon()
  @EventPattern(EventsNamesStatsEnum.checkStatsPspAccount)
  async checkStatsPspAccountEvent(
    @Payload() transfer: TransferDocument,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    this.statsServiceService.checkStatsPspAccount(transfer);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesStatsEnum.findAllStatsPspAccount)
  async findAllStatsPspAccount(
    @Ctx() ctx: RmqContext,
    @Payload() query?: QuerySearchAnyDto,
  ) {
    CommonService.ack(ctx);
    return this.statsServiceService.findAllPspAccountStats(query);
  }

  private async filterFromUserPermissions(
    query: QuerySearchAnyDto,
    req,
  ): Promise<QuerySearchAnyDto> {
    const user = req?.user;
    if (user) {
      query.where = query.where ?? {};
      const psps = [];
      const crms = [];
      const brands = [];
      const affiliates = [];
      let isSuperadmin = false;
      for (const permission of user.permissions) {
        if (permission.action === ActionsEnum.MANAGE) {
          isSuperadmin = true;
          break;
        }
        if (permission.scope) {
          if (permission.scope.resourceName === ResourcesEnum.BRAND) {
            brands.push(permission.scope.resourceId);
          } else if (permission.scope.resourceName === ResourcesEnum.CRM) {
            crms.push(permission.scope.resourceId);
          } else if (permission.scope.resourceName === ResourcesEnum.PSP) {
            psps.push(permission.scope.resourceId);
          } else if (
            permission.scope.resourceName === ResourcesEnum.AFFILIATE
          ) {
            affiliates.push(permission.scope.resourceId);
          }
        }
      }
      if (!isSuperadmin) {
        if (brands.length) {
          query.where.brand = {
            $in: brands,
          };
        }
        if (psps.length) {
          query.where.psps = {
            $in: psps,
          };
        }
        if (crms.length) {
          query.where.crm = {
            $in: crms,
          };
        }
        if (affiliates.length) {
          query.where.affiliate = {
            $in: affiliates,
          };
        }
      }
      if (req.user?.userParent) {
        //TODO[hender - 14/02/2024] If userParent,search only data of affiliates with userParent as user
        const affiliates = await this.builder.getPromiseAffiliateEventClient(
          EventsNamesAffiliateEnum.findAll,
          {
            take: 100000,
            where: {
              user: req.user?.userParent,
            },
          },
        );
        query.where.affiliate = {
          $in: affiliates.list.map((affiliate) => affiliate._id),
        };
      }
    }
    return query;
  }
}
