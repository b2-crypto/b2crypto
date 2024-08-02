import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AccountCreateDto } from '@account/account/dto/account.create.dto';
import { AccountUpdateDto } from '@account/account/dto/account.update.dto';
import { BuildersService } from '@builder/builders';
import GenericServiceController from '@common/common/interfaces/controller.generic.interface';
import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { UpdateAnyDto } from '@common/common/models/update-any.dto';
import { MessagePattern, RmqContext } from '@nestjs/microservices';
import { AccountServiceService } from './account-service.service';
import EventsNamesAccountEnum from './enum/events.names.account.enum';
import { ActivityCreateDto } from '@activity/activity/dto/activity.create.dto';
import { CommonService } from '@common/common';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';

@ApiTags('ACCOUNT')
@Controller('accounts')
export class AccountServiceController implements GenericServiceController {
  constructor(
    private readonly accountService: AccountServiceService,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
  ) {}

  protected getAccountService() {
    return this.accountService;
  }

  @Get('all')
  findAll(@Query() query: QuerySearchAnyDto, req?: any) {
    return this.accountService.findAll(query);
  }

  @Get('me')
  findAllMe(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    query = CommonService.getQueryWithUserId(query, req, 'owner');
    return this.accountService.findAll(query);
  }

  @Patch('lock/:accountId')
  async blockedOneById(@Param('accountId') id: string) {
    return this.updateStatusAccount(id, 'block');
  }

  @Patch('unlock/:accountId')
  async unblockedOneById(@Param('accountId') id: string) {
    return this.updateStatusAccount(id, 'active');
  }

  @Patch('cancel/:accountId')
  async cancelOneById(@Param('accountId') id: string) {
    return this.updateStatusAccount(id, 'cancel');
  }

  @Patch('disable/:accountId')
  async disableOneById(@Param('accountId') id: string) {
    return this.updateStatusAccount(id, 'inactive');
  }

  async updateStatusAccount(id: string, slugName: string) {
    const account = await this.accountService.findOneById(id);
    const status = await this.builder.getPromiseStatusEventClient(
      EventsNamesStatusEnum.findOneByName,
      {
        slug: slugName,
      },
    );
    account.status = status;
    return account.save();
  }

  @Get(':accountId')
  findOneById(@Param('accountId') id: string) {
    return this.accountService.findOneById(id);
  }

  @Post('create')
  createOne(@Body() createDto: AccountCreateDto, req?: any) {
    return this.accountService.createOne(createDto);
  }

  @Post('all')
  createMany(
    @Body(new ParseArrayPipe({ items: ActivityCreateDto }))
    createsDto: AccountCreateDto[],
    req?: any,
  ) {
    return this.accountService.createMany(createsDto);
  }

  @Patch()
  updateOne(@Body() updateDto: AccountUpdateDto, req?: any) {
    return this.accountService.updateOne(updateDto);
  }

  @Patch('all')
  updateMany(
    @Body(new ParseArrayPipe({ items: ActivityCreateDto }))
    updatesDto: AccountUpdateDto[],
    req?: any,
  ) {
    return this.accountService.updateMany(updatesDto);
  }

  @Delete('all')
  deleteManyById(
    @Body(new ParseArrayPipe({ items: UpdateAnyDto })) ids: AccountUpdateDto[],
    req?: any,
  ) {
    return this.accountService.deleteManyById(ids);
  }

  @Delete(':accountID')
  deleteOneById(@Param('accountID') id: string, req?: any) {
    return this.accountService.deleteOneById(id);
  }

  @MessagePattern(EventsNamesAccountEnum.findAll)
  findAllEvent(query: QuerySearchAnyDto, ctx: RmqContext) {
    return this.accountService.findAll(query, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.findOneById)
  findOneByIdEvent(id: string, ctx: RmqContext) {
    return this.accountService.findOneById(id, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.createOne)
  createOneEvent(createDto: CreateAnyDto, ctx: RmqContext) {
    return this.accountService.createOneEvent(createDto, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.createMany)
  createManyEvent(createsDto: CreateAnyDto[], ctx: RmqContext) {
    return this.accountService.createManyEvent(createsDto, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.updateOne)
  updateOneEvent(updateDto: UpdateAnyDto, ctx: RmqContext) {
    return this.accountService.updateOneEvent(updateDto, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.updateMany)
  updateManyEvent(updatesDto: UpdateAnyDto[], ctx: RmqContext) {
    return this.accountService.updateManyEvent(updatesDto, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.deleteMany)
  deleteManyByIdEvent(ids: UpdateAnyDto[], ctx: RmqContext) {
    return this.accountService.deleteManyByIdEvent(ids, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.deleteOneById)
  deleteOneByIdEvent(id: string, ctx: RmqContext) {
    return this.accountService.deleteOneByIdEvent(id, ctx);
  }

  protected async getUser(userId) {
    return (
      await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.findAll,
        {
          relations: ['personalData'],
          where: {
            _id: userId,
          },
        },
      )
    ).list[0];
  }
}
