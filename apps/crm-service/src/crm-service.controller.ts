import {
  Body,
  CACHE_MANAGER,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { CommonService } from '@common/common';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import GenericServiceController from '@common/common/interfaces/controller.generic.interface';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { UpdateAnyDto } from '@common/common/models/update-any.dto';
import { CrmCreateDto } from '@crm/crm/dto/crm.create.dto';
import { CrmUpdateDto } from '@crm/crm/dto/crm.update.dto';
import { CrmEntity } from '@crm/crm/entities/crm.entity';
import { CrmDocument } from '@crm/crm/entities/mongoose/crm.schema';
import { Cache, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import ResponseB2Crypto from '@response-b2crypto/response-b2crypto/models/ResponseB2Crypto';
import { ConfigCheckStatsDto } from '@stats/stats/dto/config.check.stats.dto';
import { TransferInterface } from '@transfer/transfer/entities/transfer.interface';
import { CrmServiceService } from './crm-service.service';
import { AutologinLeadFromAffiliateDto } from './dto/autologin.lead.from.affiliate.dto';
import { CheckLeadStatusOnCrmDto } from './dto/check.lead.status.on.crm.dto';
import { CreateLeadOnCrmDto } from './dto/create.lead.on.crm.dto';
import { CreateTransferOnCrmDto } from './dto/create.transfer.on.crm.dto';
import EventsNamesCrmEnum from './enum/events.names.crm.enum';

@ApiTags('CRM')
@Controller('crm')
export class CrmServiceController implements GenericServiceController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly crmService: CrmServiceService,
    private readonly configService: ConfigService,
  ) {}

  @Get('all/retention')
  // @CheckPoliciesAbility(new PolicyHandlerCategoryRead())
  @ApiResponse({
    status: 200,
    description: 'was searched successfully',
    type: CrmEntity,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async findAllRetention(@Query() query: QuerySearchAnyDto) {
    return this.crmService.getAllRetention(query);
  }

  @Get('all/sales')
  // @CheckPoliciesAbility(new PolicyHandlerCategoryRead())
  @ApiResponse({
    status: 200,
    description: 'was searched successfully',
    type: CrmEntity,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async findAllSales(@Query() query: QuerySearchAnyDto) {
    return this.crmService.getAllSales(query);
  }

  @Get('all/:departmentName')
  // @CheckPoliciesAbility(new PolicyHandlerCategoryRead())
  @ApiResponse({
    status: 200,
    description: 'was searched successfully',
    type: CrmEntity,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async findAllByDepartment(
    @Param('departmentName') departmentName: string,
    @Query() query: QuerySearchAnyDto,
  ) {
    return this.crmService.getAllByDepartment(query, departmentName);
  }

  @Get('all')
  // @CheckPoliciesAbility(new PolicyHandlerCategoryRead())
  @ApiResponse({
    status: 200,
    description: 'was searched successfully',
    type: CrmEntity,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async findAll(@Query() query: QuerySearchAnyDto) {
    return this.crmService.getAll(query);
  }

  @Get(':crmID')
  // @CheckPoliciesAbility(new PolicyHandlerCrmRead())
  @ApiResponse({
    status: 200,
    description: 'was searched successfully',
    type: CrmEntity,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async findOneById(@Param('crmID') id: string) {
    return this.crmService.getOne(id);
  }

  @Get('/name/:crmName')
  // @CheckPoliciesAbility(new PolicyHandlerCrmRead())
  @ApiResponse({
    status: 200,
    description: 'was searched successfully',
    type: String,
  })
  @CacheTTL(5)
  async getIdCrmByName(@Param('crmName') name: string) {
    const list = await this.crmService.getAll({
      where: {
        slug: CommonService.getSlug(name),
      },
    });
    if (list.totalElements) {
      return list.list[0]._id;
    }
    throw new NotFoundException('Not found Crm');
  }

  @Post()
  // @CheckPoliciesAbility(new PolicyHandlerCrmCreate())
  @ApiResponse({
    status: 201,
    description: 'was successfully created',
    type: CrmCreateDto,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  async createOne(@Body() createCrmDto: CrmCreateDto) {
    return this.crmService.newCrm(createCrmDto);
  }

  @Post('all')
  // @CheckPoliciesAbility(new PolicyHandlerCrmCreate())
  @ApiResponse({
    status: 201,
    description: 'was successfully created',
    type: CrmCreateDto,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  async createMany(
    @Body(new ParseArrayPipe({ items: CrmCreateDto }))
    createCrmsDto: CrmCreateDto[],
  ) {
    return this.crmService.newManyCrm(createCrmsDto);
  }

  @Patch()
  // @CheckPoliciesAbility(new PolicyHandlerCrmUpdate())
  @ApiResponse({
    status: 201,
    description: 'was successfully created',
    type: CrmUpdateDto,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  async updateOne(@Body() updateCrmDto: CrmUpdateDto) {
    return this.crmService.updateCrm(updateCrmDto);
  }

  @Patch('all')
  // @CheckPoliciesAbility(new PolicyHandlerCrmUpdate())
  @ApiResponse({
    status: 201,
    description: 'was successfully created',
    type: CrmUpdateDto,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  async updateMany(
    @Body(new ParseArrayPipe({ items: CrmUpdateDto }))
    updateCrmsDto: CrmUpdateDto[],
  ) {
    return this.crmService.updateManyCrms(updateCrmsDto);
  }

  @Delete('all')
  // @CheckPoliciesAbility(new PolicyHandlerCrmDelete())
  @ApiExcludeEndpoint(true)
  async deleteManyById(
    @Body(new ParseArrayPipe({ items: CrmUpdateDto }))
    ids: CrmUpdateDto[],
  ) {
    return this.crmService.deleteManyCrms(ids.map((crm) => crm.id.toString()));
  }

  @Delete(':crmID')
  // @CheckPoliciesAbility(new PolicyHandlerCrmDelete())
  @ApiExcludeEndpoint(true)
  async deleteOneById(@Param('crmID') id: string) {
    return this.crmService.deleteCrm(id);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCrmEnum.findAll)
  findAllEvent(@Payload() query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.findAll(query);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCrmEnum.createMany)
  createManyEvent(
    @Payload() createsDto: CrmCreateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    const crm = this.createMany(createsDto);
    CommonService.ack(ctx);
    return crm;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCrmEnum.updateOne)
  updateOneEvent(@Payload() updateDto: CrmUpdateDto, @Ctx() ctx: RmqContext) {
    const crm = this.updateOne(updateDto);
    CommonService.ack(ctx);
    return crm;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCrmEnum.updateMany)
  updateManyEvent(
    @Payload() updatesDto: CrmUpdateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    const crm = this.updateMany(updatesDto);
    CommonService.ack(ctx);
    return crm;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCrmEnum.deleteMany)
  deleteManyByIdEvent(@Payload() ids: UpdateAnyDto[], @Ctx() ctx: RmqContext) {
    const crm = this.deleteManyById(ids);
    CommonService.ack(ctx);
    return crm;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCrmEnum.deleteOne)
  deleteOneByIdEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    const crm = this.deleteOneById(id);
    CommonService.ack(ctx);
    return crm;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCrmEnum.createOne)
  async createOneEvent(
    @Payload() createCrmDto: CrmCreateDto,
    @Ctx() ctx: RmqContext,
  ): Promise<CrmDocument> {
    const crm = await this.crmService.newCrm(createCrmDto);
    CommonService.ack(ctx);
    return crm;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCrmEnum.findOneById)
  async findOneByIdEvent(
    @Payload() crmId: string,
    @Ctx() ctx: RmqContext,
  ): Promise<CrmDocument> {
    CommonService.ack(ctx);
    return this.crmService.getOne(crmId);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCrmEnum.findOneByName)
  async findOneEventByName(
    @Payload() crmName: string,
    @Ctx() ctx: RmqContext,
  ): Promise<CrmDocument> {
    CommonService.ack(ctx);
    const crms = await this.crmService.getAll({
      where: {
        name: crmName,
      },
    });
    if (crms.totalElements) {
      return crms.list[0];
    }
    throw new NotFoundException('Not found Crm');
  }
  @AllowAnon()
  @CacheTTL(5)
  @CacheKey(EventsNamesCrmEnum.getIdCrmByNameCached)
  @MessagePattern(EventsNamesCrmEnum.getIdCrmByNameCached)
  async getIdCrmEventByNameCached(
    @Payload() crmName: string,
    @Ctx() ctx: RmqContext,
  ): Promise<string> {
    CommonService.ack(ctx);
    const crms = await this.crmService.getAll({
      where: {
        slug: CommonService.getSlug(crmName),
      },
    });
    if (crms.totalElements) {
      return crms.list[0]._id;
    }
    throw new NotFoundException('Not found Crm');
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCrmEnum.createOneLeadOnCrm)
  async createOneLeadOnCrmEvent(
    @Payload() data: CreateLeadOnCrmDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    if (this.configService.get('ENVIRONMENT') === EnvironmentEnum.prod) {
      return this.crmService.createOneLeadOnCrm(data);
    }
    return {
      error: false,
    };
  }
  @AllowAnon()
  @MessagePattern(EventsNamesCrmEnum.moveOneLeadOnCrm)
  async moveOneLeadOnCrmEvent(
    @Payload() data: CreateLeadOnCrmDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.crmService.createOneLeadOnCrm(data, true);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCrmEnum.autologinLeadOnCrm)
  async autologinLeadOnCrmEvent(
    @Payload() data: AutologinLeadFromAffiliateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return await this.crmService.autologinLeadOnCrm(data);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCrmEnum.createOneTransferOnCrm)
  async createOneTransferOnCrmEvent(
    @Payload() data: CreateTransferOnCrmDto,
    @Ctx() ctx: RmqContext,
  ): Promise<TransferInterface> {
    const transfer = this.crmService.createOneTransferOnCrm(data);
    CommonService.ack(ctx);
    return transfer;
  }

  @AllowAnon()
  @EventPattern(EventsNamesCrmEnum.checkCrmStats)
  async checkCrmStats(
    @Payload() configCheckStats: ConfigCheckStatsDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    this.crmService.checkStats(configCheckStats);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCrmEnum.updateOneCrmById)
  async updateCrmGlobalStats(
    @Payload() updateCrmDto: CrmUpdateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.crmService.updateCrm(updateCrmDto);
  }

  @AllowAnon()
  @EventPattern(EventsNamesCrmEnum.checkCrmLeadStatus)
  async checkCrmLeadStatus(
    @Payload() data: CheckLeadStatusOnCrmDto,
    @Ctx() ctx: RmqContext,
  ) {
    this.crmService.checkCrmLeadStatus(data);
    CommonService.ack(ctx);
  }
}
