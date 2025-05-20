import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import TransportEnum from '@common/common/enums/TransportEnum';
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
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import EventsNamesMessageEnum from './enum/events.names.message.enum';
import { MessageServiceService } from './message-service.service';

@ApiTags('MESSAGE')
@Traceable()
@Controller('message')
export class MessageServiceController implements GenericServiceController {
  constructor(
    @InjectPinoLogger(MessageServiceController.name)
    protected readonly logger: PinoLogger,
    private readonly messageService: MessageServiceService,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
  ) {}

  @AllowAnon()
  @HttpCode(HttpStatus.OK)
  @Post('/send-emails/:email')
  async sendEmails(@Param('email') email: string) {
    const transactionDate = new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: 'America/Bogota',
    }).format(new Date());
    const transactionDateCapitalized =
      transactionDate.charAt(0).toUpperCase() + transactionDate.slice(1);

    const sendEmailOtpNotificationData = {
      destinyText: email,
      destiny: null,
      vars: {
        name: email,
        lastname: '',
        otp: '123456',
      },
    };

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendEmailOtpNotification,
      sendEmailOtpNotificationData,
    );

    const sendEmailBalanceReportData = {
      name: 'subject',
      body: ``,
      originText: `System`,
      destinyText: email,
      transport: TransportEnum.EMAIL,
      destiny: null,
      vars: {
        name: email,
        lastname: '',
      },
      // attachments: attachments,
    };

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendEmailBalanceReport,
      sendEmailBalanceReportData,
    );

    const sendPurchasesData = {
      transport: TransportEnum.EMAIL,
      vars: {
        cardId: 'crd-2gYdAdniISpBYunuGWs41x0A1f8',
        name: '',
        transactionId: 'ctx-123',
        transactionDate: transactionDateCapitalized,
        transactionTime: '12:00pm',
        transactionStatus: 'APPROVED',
        transactionType: 'Purchase',
        merchant: 'La bodega',
        lastFourDigits: '1234',
        amountReload: '1000.00 USDT',
        currency: 'USDT',
      },
    };

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendPurchases,
      sendPurchasesData,
    );

    const sendPurchaseRejectedData = {
      transport: TransportEnum.EMAIL,
      vars: {
        cardId: 'crd-2gYdAdniISpBYunuGWs41x0A1f8',
        name: '',
        transactionId: 'ctx-123',
        transactionDate: transactionDateCapitalized,
        transactionTime: '12:00pm',
        transactionStatus: 'REJECTED',
        transactionType: 'Purchase',
        merchant: 'La bodega',
        lastFourDigits: '1234',
        amountReload: '1000.00 USDT',
        currency: 'USDT',
        rejectionReason: 'TESTING',
      },
    };

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendPurchaseRejected,
      sendPurchaseRejectedData,
    );

    const sendCardRequestConfirmationEmailData = {
      destinyText: email,
      vars: {
        name: email,
        lastName: '',
        accountType: 'PHYSICAL',
        cardType: 'CARD',
        accountId: '672b8b9d6a78d67a754d2fac',
        status: 'UNLOCK',
        owner: '66c40d99c0a95e5d58e52634',
      },
    };

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendCardRequestConfirmationEmail,
      sendCardRequestConfirmationEmailData,
    );

    const sendProfileRegistrationCreationData = {
      destinyText: email,
      vars: {
        name: email,
        email: email,
        username: email,
        isIndividual: true,
        isActive: true,
      },
    };

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendProfileRegistrationCreation,
      sendProfileRegistrationCreationData,
    );

    const sendAdjustmentsData = {
      destinyText: email,
      vars: {
        cardId: 'crd-2gYdAdniISpBYunuGWs41x0A1f8',
        transactionType: 'PURCHASE',
        merchantName: 'La bodega',
        cardLastFour: '1234',
        amountLocal: '1000',
        currencyLocal: 'USD',
      },
    };

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendAdjustments,
      sendAdjustmentsData,
    );

    const sendCryptoWalletsManagementData = {
      destinyText: email,
      vars: {
        name: email,
        accountType: 'VAULT',
        accountName: 'hjhjgvhjhjbjhgbjh',
        balance: '1000',
        currency: 'USDT',
        accountId: '6717a41f596c15069d5fa520',
      },
    };

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendCryptoWalletsManagement,
      sendCryptoWalletsManagementData,
    );

    const sendPasswordRestoredEmailData = {
      name: `Actualizacion de clave`,
      body: `Tu clave ha sido actualizada exitosamente ${email}`,
      originText: 'Sistema',
      destinyText: email,
      transport: TransportEnum.EMAIL,
      destiny: null,
      vars: {
        name: email,
        username: email,
        password: '123456',
        datetime: transactionDateCapitalized,
      },
    };

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendPasswordRestoredEmail,
      sendPasswordRestoredEmailData,
    );

    const sendActivatePhysicalCardsData = {
      name: `Activacion de tarjeta`,
      body: `Nos complace informarte que tu tarjeta física ha sido activada exitosamente.`,
      originText: 'Sistema',
      destinyText: email,
      transport: TransportEnum.EMAIL,
      destiny: null,
      vars: {
        name: email,
        lastFour: '1234',
      },
    };

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendActivatePhysicalCards,
      sendActivatePhysicalCardsData,
    );

    const sendDepositWalletReceivedData = {
      name: 'Se ha recibido un deposito en tu wallet',
      body: `Tu wallet ha sido recargada exitosamente`,
      originText: 'Sistema',
      destinyText: email,
      transport: TransportEnum.EMAIL,
      destiny: null,
      vars: {
        name: email,
        currency: 'USDT',
        amountReload: '1000.00',
        transactionDate: transactionDateCapitalized,
        transactionHash: '0x1234567890abcdef',
      },
    };

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendDepositWalletReceived,
      sendDepositWalletReceivedData,
    );

    const sendRechargeCardReceivedData = {
      name: 'Se ha recibido una recarga en tu tarjeta',
      body: `Tu tarjeta ha sido recargada exitosamente`,
      originText: 'Sistema',
      destinyText: email,
      transport: TransportEnum.EMAIL,
      destiny: null,
      vars: {
        name: email,
        currency: 'USDT',
        amountReload: '1000.00',
        transactionDate: transactionDateCapitalized,
        amountAccount: '2000.00',
      },
    };

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendRechargeCardReceived,
      sendRechargeCardReceivedData,
    );
  }

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
        `[eventSendEmailDisclaimer] error: ${err.message || err}`,
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
        `[eventSendEmailOtpNotification] error: ${err.message || err}`,
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
      this.logger.error(`[eventSendEmailReport] error: ${err.message || err}`);
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
      this.logger.error(`[eventSendPurchases] error: ${err.message || err}`);
    }
  }

  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendPurchaseRejected)
  async eventSendPurchaseRejected(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendPurchaseRejected(message);
    } catch (err) {
      this.logger.error(`[eventSendEmailReport] error: ${err.message || err}`);
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
        `[eventSendCardRequestConfirmationEmail] error: ${err.message || err}`,
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
        `[eventSendProfileRegistrationCreation] error: ${err.message || err}`,
      );
    }
  }

  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendActivatePhysicalCards)
  async eventSendActivatePhysicalCards(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendActivatePhysicalCards(message);
    } catch (err) {
      this.logger.error(
        `[eventSendActivatePhysicalCards] error: ${err.message || err}`,
      );
    }
  }

  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendDepositWalletReceived)
  async eventSendDepositWalletReceived(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendDepositWalletReceived(message);
    } catch (err) {
      this.logger.error(
        `[eventSendDepositWalletReceived] error: ${err.message || err}`,
      );
    }
  }

  @AllowAnon()
  @EventPattern(EventsNamesMessageEnum.sendRechargeCardReceived)
  async eventSendRechargeCardReceived(
    @Payload() message: MessageCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    try {
      await this.messageService.sendRechargeCardReceived(message);
    } catch (err) {
      this.logger.error(
        `[eventSendRechargeCardReceived] error: ${err.message || err}`,
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
      this.logger.error(`[eventSendAdjustments] error: ${err.message || err}`);
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
        `[eventSendCryptoWalletsManagement] error: ${err.message || err}`,
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
        `[eventSendSecurityNotifications] error: ${err.message || err}`,
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
        `[eventSendPasswordRestoredEmail] error: ${err.message || err}`,
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
      this.logger.error(`[eventSendPreRegister] error: ${err.message || err}`);
    }
  }
}
