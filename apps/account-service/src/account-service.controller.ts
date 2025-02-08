import { AccountCreateDto } from '@account/account/dto/account.create.dto';
import { AccountUpdateDto } from '@account/account/dto/account.update.dto';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import { ActivityCreateDto } from '@activity/activity/dto/activity.create.dto';
import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
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
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AccountServiceService } from './account-service.service';
import EventsNamesAccountEnum from './enum/events.names.account.enum';

@ApiTags('ACCOUNT')
@Traceable()
@Controller('accounts')
export class AccountServiceController implements GenericServiceController {
  constructor(
    @InjectPinoLogger(AccountServiceController.name)
    protected readonly logger: PinoLogger,
    private readonly accountService: AccountServiceService,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
  ) {}

  protected getAccountService() {
    return this.accountService;
  }

  @ApiExcludeEndpoint()
  @Get('all')
  @NoCache()
  findAll(@Query() query: QuerySearchAnyDto, req?: any) {
    return this.accountService.findAll(query);
  }

  @ApiExcludeEndpoint()
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

  @ApiExcludeEndpoint()
  @Get('me')
  @NoCache()
  findAllMe(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    query = CommonService.getQueryWithUserId(query, req, 'owner');
    return this.accountService.findAll(query);
  }

  @ApiExcludeEndpoint()
  @Patch('lock/:accountId')
  async blockedOneById(@Param('accountId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.LOCK);
  }

  @ApiExcludeEndpoint()
  @Patch('unlock/:accountId')
  async unblockedOneById(@Param('accountId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.UNLOCK);
  }

  @ApiExcludeEndpoint()
  @Patch('cancel/:accountId')
  async cancelOneById(@Param('accountId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.CANCEL);
  }

  @ApiExcludeEndpoint()
  @Patch('hidden/:accountId')
  async disableOneById(@Param('accountId') id: string) {
    return this.toggleVisibleToOwner(id, false);
  }

  @ApiExcludeEndpoint()
  @Patch('visible/:accountId')
  async enableOneById(@Param('accountId') id: string) {
    return this.toggleVisibleToOwner(id, true);
  }

  @ApiExcludeEndpoint()
  @Get(':accountId')
  @NoCache()
  findOneById(@Param('accountId') id: string) {
    return this.accountService.findOneById(id);
  }

  @ApiExcludeEndpoint()
  @Post('create')
  createOne(@Body() createDto: AccountCreateDto, req?: any) {
    return this.accountService.createOne(createDto);
  }

  @ApiExcludeEndpoint()
  @Post('all')
  createMany(
    @Body(new ParseArrayPipe({ items: ActivityCreateDto }))
    createsDto: AccountCreateDto[],
    req?: any,
  ) {
    return this.accountService.createMany(createsDto);
  }

  @ApiExcludeEndpoint()
  @Patch()
  updateOne(@Body() updateDto: AccountUpdateDto, req?: any) {
    return this.accountService.updateOne(updateDto);
  }

  @ApiExcludeEndpoint()
  @Patch('all')
  updateMany(
    @Body(new ParseArrayPipe({ items: ActivityCreateDto }))
    updatesDto: AccountUpdateDto[],
    req?: any,
  ) {
    return this.accountService.updateMany(updatesDto);
  }

  @ApiExcludeEndpoint()
  @Delete('all')
  deleteManyById(
    @Body(new ParseArrayPipe({ items: UpdateAnyDto })) ids: AccountUpdateDto[],
    req?: any,
  ) {
    throw new UnauthorizedException();
    return this.accountService.deleteManyById(ids);
  }

  @ApiExcludeEndpoint()
  @Delete(':accountID')
  deleteOneById(@Param('accountID') id: string, req?: any) {
    throw new UnauthorizedException();
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
  updateOneEvent(
    @Payload() updateDto: AccountCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.accountService.updateOneEvent(updateDto, ctx);
  }
  @MessagePattern(EventsNamesAccountEnum.customUpdateOne)
  @EventPattern(EventsNamesAccountEnum.customUpdateOne)
  customUpdateOneEvent(
    @Payload() updateDto: AccountCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.accountService.customUpdateOne(updateDto);
  }

  @MessagePattern(EventsNamesAccountEnum.updateMany)
  updateManyEvent(
    @Payload() updatesDto: AccountCreateDto[],
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
    this.logger.info(`[getBalanceReport] ${JSON.stringify(query)}`);
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
