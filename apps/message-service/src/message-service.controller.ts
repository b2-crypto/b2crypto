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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import GenericServiceController from '@common/common/interfaces/controller.generic.interface';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { UpdateAnyDto } from '@common/common/models/update-any.dto';
import { LeadDocument } from '@lead/lead/entities/mongoose/lead.schema';
import { MessageCreateDto } from '@message/message/dto/message.create.dto';
import { MessageUpdateDto } from '@message/message/dto/message.update.dto';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import EventsNamesMessageEnum from './enum/events.names.message.enum';
import { MessageServiceService } from './message-service.service';

@ApiTags('MESSAGE')
@Traceable()
@Controller('message')
export class MessageServiceController implements GenericServiceController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    private readonly messageService: MessageServiceService,
  ) {}

  @NoCache()
  @Get('all')
  // @CheckPoliciesAbility(new PolicyHandlerMessageRead())
  async findAll(@Query() query: QuerySearchAnyDto) {
    return this.messageService.getAll(query);
  }

  @NoCache()
  @Get(':messageID')
  // @CheckPoliciesAbility(new PolicyHandlerMessageRead())
  async findOneById(@Param('messageID') id: string) {
    return this.messageService.getOne(id);
  }

  @Post()
  // @CheckPoliciesAbility(new PolicyHandlerMessageCreate())
  async createOne(@Body() createMessageDto: MessageCreateDto) {
    return this.messageService.newMessage(createMessageDto);
  }

  @Post('all')
  // @CheckPoliciesAbility(new PolicyHandlerMessageCreate())
  async createMany(
    @Body(new ParseArrayPipe({ items: MessageCreateDto }))
    createMessagesDto: MessageCreateDto[],
  ) {
    return this.messageService.newManyMessage(createMessagesDto);
  }

  @Patch()
  // @CheckPoliciesAbility(new PolicyHandlerMessageUpdate())
  async updateOne(@Body() updateMessageDto: MessageUpdateDto) {
    return this.messageService.updateMessage(updateMessageDto);
  }

  @Patch('all')
  // @CheckPoliciesAbility(new PolicyHandlerMessageUpdate())
  async updateMany(
    @Body(new ParseArrayPipe({ items: MessageUpdateDto }))
    updateMessagesDto: MessageUpdateDto[],
  ) {
    return this.messageService.updateManyMessages(updateMessagesDto);
  }

  @Delete(':messageID')
  // @CheckPoliciesAbility(new PolicyHandlerMessageDelete())
  async deleteOneById(@Param('messageID') id: string) {
    return this.messageService.deleteMessage(id);
  }

  @Delete('all')
  // @CheckPoliciesAbility(new PolicyHandlerMessageDelete())
  async deleteManyById(
    @Body(new ParseArrayPipe({ items: MessageUpdateDto }))
    ids: MessageUpdateDto[],
  ) {
    return this.messageService.deleteManyMessages(
      ids.map((message) => message.id),
    );
  }

  @AllowAnon()
  @MessagePattern(EventsNamesMessageEnum.findAll)
  findAllEvent(@Payload() query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.findAll(query);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesMessageEnum.findOneById)
  findOneByIdEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.findOneById(id);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesMessageEnum.createOne)
  createOneEvent(
    @Payload() createDto: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    const message = this.createOne(createDto);
    CommonService.ack(ctx);
    return message;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesMessageEnum.createMany)
  createManyEvent(
    @Payload() createsDto: MessageCreateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    const message = this.createMany(createsDto);
    CommonService.ack(ctx);
    return message;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesMessageEnum.updateOne)
  updateOneEvent(
    @Payload() updateDto: MessageUpdateDto,
    @Ctx() ctx: RmqContext,
  ) {
    const message = this.updateOne(updateDto);
    CommonService.ack(ctx);
    return message;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesMessageEnum.updateMany)
  updateManyEvent(
    @Payload() updatesDto: MessageUpdateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    const message = this.updateMany(updatesDto);
    CommonService.ack(ctx);
    return message;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesMessageEnum.deleteMany)
  deleteManyByIdEvent(@Payload() ids: UpdateAnyDto[], @Ctx() ctx: RmqContext) {
    const message = this.deleteManyById(ids);
    CommonService.ack(ctx);
    return message;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesMessageEnum.deleteOneById)
  deleteOneByIdEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    const message = this.deleteOneById(id);
    CommonService.ack(ctx);
    return message;
  }

  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendEmailDisclaimer)
  async eventSendEmailDisclaimer(
    @Payload() lead: LeadDocument,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      this.messageService.sendEmailDisclaimer(lead);
    } catch (err) {
      this.logger.error(
        `${MessageServiceController.name}-sendEmailDisclaimer`,
        err,
      );
    }
  }

  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendEmailOtpNotification)
  async eventSendEmailOtpNotification(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendEmailOtpNotification(message);
    } catch (err) {
      this.logger.error(
        `${MessageServiceController.name}-sendEmailOtpNotification`,
        err,
      );
    }
  }

  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendEmailBalanceReport)
  async eventSendEmailReport(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendEmailBalanceReport(message);
    } catch (err) {
      this.logger.error(MessageServiceController.name, err);
    }
  }

  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendCardRequestConfirmationEmail)
  async eventSendCardRequestConfirmationEmail(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendCardRequestConfirmationEmail(message);
    } catch (err) {
      this.logger.error(
        `${MessageServiceController.name}-sendCardRequestConfirmationEmail`,
        err,
      );
    }
  }

  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendProfileRegistrationCreation)
  async eventSendProfileRegistrationCreation(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendProfileRegistrationCreation(message);
    } catch (err) {
      this.logger.error(
        `${MessageServiceController.name}-sendProfileRegistrationCreation`,
        err,
      );
    }
  }

  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendVirtualPhysicalCards)
  async eventSendVirtualPhysicalCards(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendVirtualPhysicalCards(message);
    } catch (err) {
      this.logger.error(
        `${MessageServiceController.name}-sendVirtualPhysicalCards`,
        err,
      );
    }
  }

  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendAdjustments)
  async eventSendAdjustments(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendAdjustments(message);
    } catch (err) {
      this.logger.error(
        `${MessageServiceController.name}-sendAdjustments`,
        err,
      );
    }
  }

  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendCryptoWalletsManagement)
  async eventSendCryptoWalletsManagement(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendCryptoWalletsManagement(message);
    } catch (err) {
      this.logger.error(
        `${MessageServiceController.name}-sendCryptoWalletsManagement`,
        err,
      );
    }
  }

  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendSecurityNotifications)
  async eventSendSecurityNotifications(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendSecurityNotifications(message);
    } catch (err) {
      this.logger.error(
        `${MessageServiceController.name}-sendSecurityNotifications`,
        err,
      );
    }
  }

  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendPasswordRestoredEmail)
  async eventSendPasswordRestoredEmail(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendPasswordRestoredEmail(message);
    } catch (err) {
      this.logger.error(
        `${MessageServiceController.name}-sendPasswordRestoredEmail`,
        err,
      );
    }
  }
  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendPurchases)
  async eventSendPurchases(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendPurchases(message);
    } catch (err) {
      this.logger.error(
        `${MessageServiceController.name}-sendPurchasesEmail`,
        err,
      );
    }
  }
  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendPreRegisterEmail)
  async eventSendPreRegister(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendPreRegisterEmail(message);
    } catch (err) {
      this.logger.error(
        `${MessageServiceController.name}-sendPreRegisterEmail`,
        err,
      );
    }
  }
}
