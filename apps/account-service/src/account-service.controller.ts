import { AccountCreateDto } from '@account/account/dto/account.create.dto';
import { AccountUpdateDto } from '@account/account/dto/account.update.dto';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import { ActivityCreateDto } from '@activity/activity/dto/activity.create.dto';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import GenericServiceController from '@common/common/interfaces/controller.generic.interface';
import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { UpdateAnyDto } from '@common/common/models/update-any.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { AccountServiceService } from './account-service.service';
import EventsNamesAccountEnum from './enum/events.names.account.enum';

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

  @Get('send-balance-card-reports')
  async sendBalanceCardReports(@Req() req?: any) {
    const user = req?.user;
    if (!user) {
      throw new BadRequestException('User not found');
    }
    // Superadmin?
    await this.builder.getPromiseAccountEventClient(
      EventsNamesAccountEnum.sendBalanceReport,
      {
        where: {
          //owner: user.id,
          type: 'CARD',
        },
      },
    );
    return {
      statusCode: 200,
      message: 'Sended reports',
    };
  }

  @Get('me')
  findAllMe(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    query = CommonService.getQueryWithUserId(query, req, 'owner');
    return this.accountService.findAll(query);
  }

  @Patch('lock/:accountId')
  async blockedOneById(@Param('accountId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.LOCK);
  }

  @Patch('unlock/:accountId')
  async unblockedOneById(@Param('accountId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.UNLOCK);
  }

  @Patch('cancel/:accountId')
  async cancelOneById(@Param('accountId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.CANCEL);
  }

  @Patch('hidden/:accountId')
  async disableOneById(@Param('accountId') id: string) {
    return this.toggleVisibleToOwner(id, false);
  }

  @Patch('visible/:accountId')
  async enableOneById(@Param('accountId') id: string) {
    return this.toggleVisibleToOwner(id, true);
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

  @MessagePattern(EventsNamesAccountEnum.count)
  countEvent(@Payload() query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.accountService.count(query, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.findAll)
  findAllEvent(@Payload() query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.accountService.findAll(query, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.findOneById)
  findOneByIdEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.accountService.findOneById(id, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.createOne)
  createOneEvent(@Payload() createDto: CreateAnyDto, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.accountService.createOneEvent(createDto, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.createMany)
  createManyEvent(
    @Payload() createsDto: AccountCreateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.accountService.createManyEvent(createsDto, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.updateOne)
  @EventPattern(EventsNamesAccountEnum.updateOne)
  updateOneEvent(@Payload() updateDto: UpdateAnyDto, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.accountService.updateOneEvent(updateDto, ctx);
  }
  @MessagePattern(EventsNamesAccountEnum.customUpdateOne)
  customUpdateOneEvent(
    @Payload() updateDto: UpdateAnyDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.accountService.customUpdateOne(updateDto);
  }

  @MessagePattern(EventsNamesAccountEnum.updateMany)
  updateManyEvent(
    @Payload() updatesDto: UpdateAnyDto[],
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.accountService.updateManyEvent(updatesDto, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.deleteMany)
  deleteManyByIdEvent(@Payload() ids: UpdateAnyDto[], @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.accountService.deleteManyByIdEvent(ids, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.deleteOneById)
  deleteOneByIdEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.accountService.deleteOneByIdEvent(id, ctx);
  }

  @MessagePattern(EventsNamesAccountEnum.sendBalanceReport)
  async getBalanceReport(
    @Payload() query: QuerySearchAnyDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    Logger.log('Get balance report', AccountServiceController.name);
    this.accountService.getBalanceReport(query);
    return true;
  }

  async toggleVisibleToOwner(id: string, visible?: boolean) {
    const account = await this.accountService.findOneById(id);
    account.showToOwner = visible ?? !account.showToOwner;
    return account.save();
  }

  async updateStatusAccount(id: string, slugName: StatusAccountEnum) {
    const account = await this.accountService.findOneById(id);
    const status = await this.builder.getPromiseStatusEventClient(
      EventsNamesStatusEnum.findOneByName,
      slugName,
    );
    account.status = status;
    account.statusText = slugName;
    return account.save();
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
