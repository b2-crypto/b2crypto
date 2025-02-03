import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { BrandCreateDto } from '@brand/brand/dto/brand.create.dto';
import { BrandUpdateDto } from '@brand/brand/dto/brand.update.dto';
import { BrandDocument } from '@brand/brand/entities/mongoose/brand.schema';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import GenericServiceController from '@common/common/interfaces/controller.generic.interface';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { UpdateAnyDto } from '@common/common/models/update-any.dto';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';
import { ConfigCheckStatsDto } from '@stats/stats/dto/config.check.stats.dto';
import { BrandServiceService } from './brand-service.service';
import EventsNamesBrandEnum from './enum/events.names.brand.enum';

@ApiTags('BRAND')
@Traceable()
@Controller('brand')
export class BrandServiceController implements GenericServiceController {
  constructor(private readonly brandService: BrandServiceService) {}

  @Get('all')
  @NoCache()
  // @CheckPoliciesAbility(new PolicyHandlerBrandRead())
  async findAll(@Query() query: QuerySearchAnyDto) {
    return this.brandService.getAll(query);
  }

  @ApiKeyCheck()
  @UseGuards(AuthGuard('api-key'))
  @Get()
  @NoCache()
  // @CheckPoliciesAbility(new PolicyHandlerBrandRead())
  async findAllApiKey(@Query() query: QuerySearchAnyDto) {
    query.take = await this.brandService.count(query);
    const rta = await this.brandService.getAll(query);
    rta.list = rta.list.map((bu) => {
      return {
        id: bu._id,
        name: bu.name,
        slug: bu.slug,
      } as BrandDocument;
    });
    return rta;
  }

  @Get('all/retention')
  @NoCache()
  // @CheckPoliciesAbility(new PolicyHandlerBrandRead())
  async findAllRetention(@Query() query: QuerySearchAnyDto) {
    return this.brandService.getAllRetention(query);
  }

  @Get('all/sales')
  @NoCache()
  // @CheckPoliciesAbility(new PolicyHandlerBrandRead())
  async findAllSales(@Query() query: QuerySearchAnyDto) {
    return this.brandService.getAllSales(query);
  }

  @Get('all/:departmentName')
  @NoCache()
  // @CheckPoliciesAbility(new PolicyHandlerBrandRead())
  async findAllByDepartment(
    @Param('departmentName') departmentName: string,
    @Query() query: QuerySearchAnyDto,
  ) {
    return this.brandService.getAllByDepartment(query, departmentName);
  }

  @Get(':brandID')
  @NoCache()
  // @CheckPoliciesAbility(new PolicyHandlerBrandRead())
  async findOneById(@Param('brandID') id: string) {
    return this.brandService.getOne(id);
  }

  @Post()
  // @CheckPoliciesAbility(new PolicyHandlerBrandCreate())
  async createOne(@Body() createBrandDto: BrandCreateDto) {
    return this.brandService.newBrand(createBrandDto);
  }

  @Post('all')
  // @CheckPoliciesAbility(new PolicyHandlerBrandCreate())
  async createMany(
    @Body(new ParseArrayPipe({ items: BrandCreateDto }))
    createBrandsDto: BrandCreateDto[],
  ) {
    return this.brandService.newManyBrand(createBrandsDto);
  }

  @Patch()
  // @CheckPoliciesAbility(new PolicyHandlerBrandUpdate())
  async updateOne(@Body() updateBrandDto: BrandUpdateDto) {
    return this.brandService.updateBrand(updateBrandDto);
  }

  @Patch('all')
  // @CheckPoliciesAbility(new PolicyHandlerBrandUpdate())
  async updateMany(
    @Body(new ParseArrayPipe({ items: BrandUpdateDto }))
    updateBrandsDto: BrandUpdateDto[],
  ) {
    return this.brandService.updateManyBrands(updateBrandsDto);
  }

  @Delete('all')
  // @CheckPoliciesAbility(new PolicyHandlerBrandDelete())
  async deleteManyById(
    @Body(new ParseArrayPipe({ items: BrandUpdateDto }))
    ids: BrandUpdateDto[],
  ) {
    return this.brandService.deleteManyBrands(
      ids.map((brand) => brand.id.toString()),
    );
  }

  @Delete(':brandID')
  // @CheckPoliciesAbility(new PolicyHandlerBrandDelete())
  async deleteOneById(@Param('brandID') id: string) {
    return this.brandService.deleteBrand(id);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesBrandEnum.findAll)
  findAllEvent(@Payload() query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.findAll(query);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesBrandEnum.findOneById)
  findOneByIdEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.findOneById(id);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesBrandEnum.createMany)
  createManyEvent(
    @Payload() createDto: BrandCreateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    const brand = this.createMany(createDto);
    CommonService.ack(ctx);
    return brand;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesBrandEnum.updateMany)
  updateManyEvent(
    @Payload() updateDto: BrandUpdateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    const brand = this.updateMany(updateDto);
    CommonService.ack(ctx);
    return brand;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesBrandEnum.deleteMany)
  deleteManyByIdEvent(@Payload() ids: UpdateAnyDto[], @Ctx() ctx: RmqContext) {
    const brand = this.deleteManyById(ids);
    CommonService.ack(ctx);
    return brand;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesBrandEnum.deleteOneById)
  deleteOneByIdEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    const brand = this.deleteOneById(id);
    CommonService.ack(ctx);
    return brand;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesBrandEnum.createOne)
  async createOneEvent(
    @Payload() createBrandDto: BrandCreateDto,
    @Ctx() ctx: RmqContext,
  ): Promise<BrandDocument> {
    const brand = this.brandService.newBrand(createBrandDto);
    CommonService.ack(ctx);
    return brand;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesBrandEnum.findOneById)
  async findOneEvent(
    @Payload() brandId: string,
    @Ctx() ctx: RmqContext,
  ): Promise<BrandDocument> {
    CommonService.ack(ctx);
    return this.brandService.getOne(brandId);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesBrandEnum.findOneByName)
  async findOneEventByName(
    @Payload() brandName: string,
    @Ctx() ctx: RmqContext,
  ): Promise<BrandDocument> {
    CommonService.ack(ctx);
    const brands = await this.findAll({
      where: {
        name: brandName,
      },
    });
    if (brands.totalElements) {
      return brands.list[0];
    }
    throw new NotFoundException('Not found brand');
  }

  @AllowAnon()
  @EventPattern(EventsNamesBrandEnum.checkCashierBrands)
  async checkCashierBrands(@Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    this.brandService.checkCashierBrands();
  }
  @AllowAnon()
  @EventPattern(EventsNamesBrandEnum.checkBrandStats)
  async checkBrandStats(
    @Payload() configCheckStats: ConfigCheckStatsDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    this.brandService.checkStats(configCheckStats);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesBrandEnum.updateOne)
  async updateOneEvent(
    @Payload() updateBrandDto: BrandUpdateDto,
    @Ctx() ctx: RmqContext,
  ): Promise<BrandDocument> {
    CommonService.ack(ctx);
    return this.brandService.updateBrand(updateBrandDto);
  }
}
