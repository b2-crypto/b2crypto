import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { ApiKeyAffiliateAuthGuard } from '@auth/auth/guards/api.key.affiliate.guard';
import { CategoryCreateDto } from '@category/category/dto/category.create.dto';
import { CategoryUpdateDto } from '@category/category/dto/category.update.dto';
import { CategoryEntity } from '@category/category/entities/category.entity';
import { CategoryDocument } from '@category/category/entities/mongoose/category.schema';
import { CommonService } from '@common/common';
import TagEnum from '@common/common/enums/TagEnum';
import GenericServiceController from '@common/common/interfaces/controller.generic.interface';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { UpdateAnyDto } from '@common/common/models/update-any.dto';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import ResponseB2Crypto from '@response-b2crypto/response-b2crypto/models/ResponseB2Crypto';
import { CategoryServiceService } from './category-service.service';
import { CategoryQueryEventsDto } from './dto/category.query.events.dto';
import { CategoryResponseDto } from './dto/category.response.dto';
import { PspAccountResponseDto } from './dto/psp.account.response.dto';
import EventsNamesCategoryEnum from './enum/events.names.category.enum';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { SwaggerSteakeyConfigEnum } from 'libs/config/enum/swagger.stakey.config.enum';
import { NoCache } from '@common/common/decorators/no-cache.decorator';

@ApiTags('CATEGORY')
@Controller('category')
export class CategoryServiceController implements GenericServiceController {
  constructor(private readonly categoryService: CategoryServiceService) {}

  @Get('all')
  @NoCache()
  // @CheckPoliciesAbility(new PolicyHandlerCategoryRead())
  async findAll(@Query() query: QuerySearchAnyDto) {
    return this.categoryService.getAll(query);
  }

  @Get('type/:type')
  @NoCache()
  // @CheckPoliciesAbility(new PolicyHandlerCategoryRead())
  async categoryListByType(
    @Query() query: QuerySearchAnyDto,
    @Param('type') type: string,
  ): Promise<ResponsePaginator<CategoryResponseDto> | string[]> {
    return this.categoryService.categoryListByType(type.toUpperCase(), query);
  }

  @Get('/resources')
  @NoCache()
  //@ApiTags('Integration Category')
  @ApiKeyCheck()
  //@UseGuards(ApiKeyAffiliateAuthGuard)
  @ApiHeader({
    name: 'b2crypto-affiliate-key',
    description: 'The affiliate secret key',
  })
  @ApiResponse({
    status: 200,
    description: 'List of resources',
    type: ResponsePaginator<CategoryEntity>,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async resourcesList(
    @Query() query: QuerySearchAnyDto,
  ): Promise<ResponsePaginator<CategoryResponseDto> | string[]> {
    return this.categoryListByType(query, 'RESOURCES');
  }

  @Get('/actions')
  @NoCache()
  //@ApiTags('Integration Category')
  @ApiKeyCheck()
  //@UseGuards(ApiKeyAffiliateAuthGuard)
  @ApiHeader({
    name: 'b2crypto-affiliate-key',
    description: 'The affiliate secret key',
  })
  @ApiResponse({
    status: 200,
    description: 'List of actions',
    type: ResponsePaginator<CategoryEntity>,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async actionsList(
    @Query() query: QuerySearchAnyDto,
  ): Promise<ResponsePaginator<CategoryResponseDto> | string[]> {
    return this.categoryListByType(query, 'ACTIONS');
  }

  @Get('/scopes')
  @NoCache()
  //@ApiTags('Integration Category')
  @ApiKeyCheck()
  //@UseGuards(ApiKeyAffiliateAuthGuard)
  @ApiHeader({
    name: 'b2crypto-affiliate-key',
    description: 'The affiliate secret key',
  })
  @ApiResponse({
    status: 200,
    description: 'List of scopes',
    type: ResponsePaginator<CategoryEntity>,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async scopesList(
    @Query() query: QuerySearchAnyDto,
  ): Promise<ResponsePaginator<CategoryResponseDto> | string[]> {
    return this.categoryListByType(query, 'SCOPES');
  }

  @Get('/country')
  @NoCache()
  @ApiTags('Affiliate Category')
  @ApiTags('Integration Category')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_LIST)
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('b2crypto-key')
  @ApiHeader({
    name: 'b2crypto-affiliate-key',
    description: 'The affiliate secret key',
  })
  @ApiResponse({
    status: 200,
    description: 'List of countries',
    type: ResponsePaginator<CategoryEntity>,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async countryList(
    @Query() query: QuerySearchAnyDto,
  ): Promise<ResponsePaginator<CategoryResponseDto> | string[]> {
    return this.categoryListByType(query, TagEnum.COUNTRY);
  }

  @AllowAnon()
  @ApiTags('Affiliate Category')
  @ApiTags('Integration Category')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_LIST)
  @ApiSecurity('b2crypto-key')
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @ApiHeader({
    name: 'b2crypto-affiliate-key',
    description: 'The affiliate secret key',
  })
  @Get('/currency')
  @NoCache()
  @ApiResponse({
    status: 200,
    description: 'List of currencies',
    type: ResponsePaginator<CategoryEntity>,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async currencyList(
    @Query() query: QuerySearchAnyDto,
  ): Promise<ResponsePaginator<CategoryResponseDto> | string[]> {
    return this.categoryListByType(query, TagEnum.CURRENCY);
  }

  @AllowAnon()
  @ApiTags('Affiliate Category')
  @ApiTags('Integration Category')
  @ApiKeyCheck()
  @UseGuards(ApiKeyAffiliateAuthGuard)
  @ApiHeader({
    name: 'b2crypto-affiliate-key',
    description: 'The affiliate secret key',
  })
  @Get('/referral-type')
  @NoCache()
  @ApiResponse({
    status: 200,
    description: 'List of referral types',
    type: ResponsePaginator<CategoryEntity>,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async referralTypeList(
    @Query() query: QuerySearchAnyDto,
  ): Promise<ResponsePaginator<CategoryResponseDto> | string[]> {
    return this.categoryListByType(query, TagEnum.REFERRAL_TYPE);
  }

  @ApiTags('Integration Category')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_LIST)
  @ApiSecurity('b2crypto-key')
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @Get('/transaction-type')
  @NoCache()
  @ApiResponse({
    status: 200,
    description: 'List of Monetary transaction',
    type: ResponsePaginator<CategoryEntity>,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async MonetaryTransactionList(
    @Query() query: QuerySearchAnyDto,
  ): Promise<ResponsePaginator<CategoryResponseDto> | string[]> {
    return this.categoryListByType(query, TagEnum.MONETARY_TRANSACTION_TYPE);
  }

  @ApiTags('Integration Category')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_LIST)
  @ApiSecurity('b2crypto-key')
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @Get('/operation-type')
  @NoCache()
  @ApiResponse({
    status: 200,
    description: 'List of Monetary transaction',
    type: ResponsePaginator<CategoryEntity>,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async MonetaryOperationList(
    @Query() query: QuerySearchAnyDto,
  ): Promise<ResponsePaginator<CategoryResponseDto> | string[]> {
    return this.categoryListByType(query, TagEnum.MONETARY_OPERATION_TYPE);
  }

  @ApiTags('Integration Category')
  @ApiKeyCheck()
  @UseGuards(ApiKeyAffiliateAuthGuard)
  @ApiSecurity('b2crypto-key')
  @Get('psp-account')
  @NoCache()
  @ApiResponse({
    status: 200,
    description: 'List of Psp Accounts',
    type: ResponsePaginator<CategoryEntity>,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async PspAccountListList(
    @Query() query: QuerySearchAnyDto,
  ): Promise<ResponsePaginator<PspAccountResponseDto>> {
    return this.categoryService.getPspAccount(query);
  }

  @ApiTags(SwaggerSteakeyConfigEnum.TAG_LIST)
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('b2crypto-key')
  @Get('/doc-type')
  @NoCache()
  async docIdTypeList(@Query() query: QuerySearchAnyDto) {
    return this.categoryListByType(query, 'doc_type');
  }

  @ApiKeyCheck()
  @Get('levels')
  // @CheckPoliciesAbility(new PolicyHandlerCategoryRead())
  async listLevels() {
    const rta = [];
    const levels = await this.categoryService.getAll({
      take: 1000,
      where: { type: TagEnum.LEVEL },
    });
    for (const level of levels.list) {
      level['options'] = [];
      const customLevels = await this.categoryService.getAll({
        take: 1000,
        where: {
          categoryParent: level.id ?? level._id,
          type: TagEnum.CUSTOM_LEVEL,
        },
      });

      for (const customLevel of customLevels.list) {
        const customRules = await this.categoryService.getAll({
          take: 1000,
          where: {
            categoryParent: customLevel.id ?? customLevel._id,
            type: TagEnum.CUSTOM_RULE,
          },
        });
        customLevel['rules'] = customRules.list.map((rule) => {
          return {
            _id: rule._id,
            name: rule.name,
            description: rule.description,
            valueNumber: rule.valueNumber,
            valueText: rule.valueText,
          };
        });
        level['options'].push({
          _id: customLevel._id,
          name: customLevel.name,
          rules: customLevel['rules'],
          description: customLevel.description,
          valueNumber: customLevel.valueNumber,
          valueText: customLevel.valueText,
        });
      }
      rta.push({
        _id: level._id,
        name: level.name,
        variants: level['options'],
        description: level.description,
        valueNumber: level.valueNumber,
        valueText: level.valueText,
      });
    }

    return rta;
  }

  @Get(':categoryID')
  @NoCache()
  // @CheckPoliciesAbility(new PolicyHandlerCategoryRead())
  async findOneById(@Param('categoryID') id: string) {
    return this.categoryService.getOne(id);
  }

  @Post()
  async createOne(@Body() createCategoryDto: CategoryCreateDto) {
    return this.categoryService.newCategory(createCategoryDto);
  }

  @Post('all')
  async createMany(
    @Body(new ParseArrayPipe({ items: CategoryCreateDto }))
    createCategoriesDto: CategoryCreateDto[],
  ) {
    return this.categoryService.newManyCategory(createCategoriesDto);
  }

  @Patch()
  async updateOne(@Body() updateCategoryDto: CategoryUpdateDto) {
    return this.categoryService.updateCategory(updateCategoryDto);
  }

  @Patch('all')
  async updateMany(
    @Body(new ParseArrayPipe({ items: CategoryUpdateDto }))
    updateCategoriesDto: CategoryUpdateDto[],
  ) {
    return this.categoryService.updateManyCategories(updateCategoriesDto);
  }

  @Delete('all')
  // @CheckPoliciesAbility(new PolicyHandlerCategoryManage())
  async deleteManyById(
    @Body(new ParseArrayPipe({ items: CategoryUpdateDto }))
    ids: CategoryUpdateDto[],
  ) {
    return this.categoryService.deleteManyCategories(
      ids.map((category) => category.id.toString()),
    );
  }

  @Delete(':categoryID')
  async deleteOneById(@Param('categoryID') id: string) {
    return this.categoryService.deleteCategory(id);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCategoryEnum.findOneById)
  async findOneByIdEvent(
    @Payload() categoryId: string,
    @Ctx() ctx: RmqContext,
  ): Promise<CategoryDocument> {
    CommonService.ack(ctx);
    return this.categoryService.getOne(categoryId);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCategoryEnum.findOneByValueText)
  async findOneByValueTextEvent(
    @Payload() categoryValueText: string,
    @Ctx() ctx: RmqContext,
  ): Promise<CategoryDocument> {
    CommonService.ack(ctx);
    const rta = await this.categoryService.getAll({
      where: {
        valueText: categoryValueText,
      },
    });

    return rta.list[0];
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCategoryEnum.findOneByNameType)
  async findOneByNameEvent(
    @Payload() categoryDto: CategoryQueryEventsDto,
    @Ctx() ctx: RmqContext,
  ): Promise<CategoryDocument> {
    CommonService.ack(ctx);
    const rta = await this.categoryService.getAll({
      where: categoryDto,
    });

    return rta.list[0];
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCategoryEnum.createOne)
  async createOneEvent(
    @Payload() createCategoryDto: CategoryCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.categoryService.newCategory(createCategoryDto);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCategoryEnum.findAll)
  findAllEvent(@Payload() query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.findAll(query);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCategoryEnum.createMany)
  createManyEvent(
    @Payload() createsDto: CategoryCreateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    const category = this.createMany(createsDto);
    CommonService.ack(ctx);
    return category;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCategoryEnum.updateOne)
  updateOneEvent(
    @Payload() updateDto: CategoryUpdateDto,
    @Ctx() ctx: RmqContext,
  ) {
    const category = this.updateOne(updateDto);
    CommonService.ack(ctx);
    return category;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCategoryEnum.updateMany)
  updateManyEvent(
    @Payload() updatesDto: CategoryUpdateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    const category = this.updateMany(updatesDto);
    CommonService.ack(ctx);
    return category;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCategoryEnum.deleteMany)
  deleteManyByIdEvent(@Payload() ids: UpdateAnyDto[], @Ctx() ctx: RmqContext) {
    const category = this.deleteManyById(ids);
    CommonService.ack(ctx);
    return category;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesCategoryEnum.deleteOne)
  deleteOneByIdEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    const category = this.deleteOneById(id);
    CommonService.ack(ctx);
    return category;
  }
}
