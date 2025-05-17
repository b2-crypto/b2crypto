/* eslint-disable prettier/prettier */
import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { CrmInterface } from '@crm/crm/entities/crm.interface';
import { Crm } from '@crm/crm/entities/mongoose/crm.schema';
import { LeadDocument } from '@lead/lead/entities/mongoose/lead.schema';
import { MessageServiceMongooseService } from '@message/message';
import { MessageCreateDto } from '@message/message/dto/message.create.dto';
import { MessageUpdateDto } from '@message/message/dto/message.update.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesCrmEnum from 'apps/crm-service/src/enum/events.names.crm.enum';
import EventsNamesLeadEnum from 'apps/lead-service/src/enum/events.names.lead.enum';
import EventsNamesPersonEnum from 'apps/person-service/src/enum/events.names.person.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import axios from 'axios';
import { isEmail } from 'class-validator';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as pug from 'pug';
import { EmailMessageBuilder } from './email-message.builder';
import TemplatesMessageEnum from './enum/templates.message.enum';

@Traceable()
@Injectable()
export class MessageServiceService {
  private apiKey: string;
  private url: string;

  constructor(
    @InjectPinoLogger(MessageServiceService.name)
    protected readonly logger: PinoLogger,
    @Inject(ConfigService)
    readonly configService: ConfigService,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
    @Inject(MessageServiceMongooseService)
    private lib: MessageServiceMongooseService,
    private mailerService: MailerService,
  ) {
    this.apiKey = configService.getOrThrow('API_KEY_EMAIL_APP');
    this.url = configService.getOrThrow('URL_API_EMAIL_APP');
  }

  async getOne(id: string) {
    return this.lib.findOne(id);
  }

  async getAll(query: QuerySearchAnyDto) {
    return this.lib.findAll(query);
  }

  async newMessage(message: MessageCreateDto) {
    return this.lib.create(message);
  }

  async newManyMessage(createMessagesDto: MessageCreateDto[]) {
    return this.lib.createMany(createMessagesDto);
  }

  async updateMessage(message: MessageUpdateDto) {
    return this.lib.update(message.id.toString(), message);
  }

  async updateManyMessages(messages: MessageUpdateDto[]) {
    return this.lib.updateMany(
      messages.map((message) => message.id.toString()),
      messages,
    );
  }

  async deleteMessage(id: string) {
    return this.lib.remove(id);
  }

  async deleteManyMessages(ids: string[]) {
    return this.lib.removeMany(ids);
  }

  async download() {
    // TODO: Implement download logic if needed
    return Promise.resolve(undefined);
  }

  private getOriginEmail(): string {
    return this.configService.get('AWS_SES_FROM_DEFAULT', 'no-reply@b2pay.app');
  }

  async sendEmailOtpNotification(message: MessageCreateDto) {
    const user = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.findOneByEmail,
      message.destinyText,
    );
    if (user) {
      message.vars = {
        ...message.vars,
        name: user.name,
      };
    }
    const emailMessage = new EmailMessageBuilder()
      .setName('A un paso de desbloquear tu vida financiera 🚀')
      .setBody(`Your OTP code is ${message.vars.otp}`)
      .setOriginText(this.getOriginEmail())
      .setDestinyText(message.destinyText)
      .setVars(message.vars)
      .build();
    return this.sendEmail(emailMessage, TemplatesMessageEnum.otpNotification);
  }

  async sendEmailBalanceReport(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName(message.name ?? 'Balance Report')
      .setBody(message.body ?? `Your balance is here.`)
      .setOriginText(this.getOriginEmail())
      .setDestinyText(message.destinyText)
      .setVars(message.vars)
      .setAttachments(message.attachments)
      .build();
    return this.sendEmail(emailMessage, TemplatesMessageEnum.report);
  }

  async sendCardRequestConfirmationEmail(message: MessageCreateDto) {
    const ownerID = message.vars.owner;
    if (ownerID) {
      const user = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.findOneById,
        { _id: ownerID },
      );
      const userPerson = await this.builder.getPromisePersonEventClient(
        EventsNamesPersonEnum.findOneById,
        { _id: user.personalData },
      );
      const emailMessage = new EmailMessageBuilder()
        .setName('¡Recibido! Tu tarjeta está en camino')
        .setBody('Your card request has been confirmed')
        .setOriginText(this.getOriginEmail())
        .setDestinyText(user.email)
        .setVars({
          ...message.vars,
          name:
            user.userCard.name && user.userCard.surname
              ? `${user.userCard.name} ${user.userCard.surname}`
              : user.name,
          address: userPerson.location.address.street_name,
        })
        .build();
      return this.sendEmail(
        emailMessage,
        TemplatesMessageEnum.cardRequestConfirmation,
      );
    }
  }
  async sendProfileRegistrationCreation(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName('¡Un nuevo capítulo empiezas hoy con B2pay! ✨')
      .setBody('Your profile has been created')
      .setOriginText(this.getOriginEmail())
      .setDestinyText(message.destinyText)
      .setVars(message.vars)
      .build();
    return this.sendEmail(
      emailMessage,
      TemplatesMessageEnum.profileRegistrationCreation,
    );
  }
  async sendPurchaseRejected(message: MessageCreateDto) {
    const account = await this.builder.getPromiseAccountEventClient(
      EventsNamesAccountEnum.findOneByCardId,
      { id: message.vars.cardId },
    );
    const ownerID = account.owner;
    if (ownerID) {
      const user = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.findOneById,
        { _id: ownerID },
      );

      if (user && user.email) {
        const emailMessage = new EmailMessageBuilder()
          .setName('No pudimos procesar tu compra, revisa los detalles')
          .setBody('Your purchase has been rejected')
          .setOriginText(this.getOriginEmail())
          .setDestinyText(message?.destinyText ?? user.email)
          .setVars({
            ...message.vars,
            name: user.name,
            currency: 'USDT',
          })
          .build();
        return this.sendEmail(
          emailMessage,
          TemplatesMessageEnum.purchaseRejected,
        );
      }
    }
  }

  async sendPasswordRestoredEmail(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName('¡Todo listo! Tu nueva contraseña ya está funcionando')
      .setBody('Your password has been successfully restored.')
      .setOriginText(this.getOriginEmail())
      .setDestinyText(message.destinyText)
      .setVars(message.vars)
      .build();
    return this.sendEmail(
      emailMessage,
      TemplatesMessageEnum.passwordRestoredConfirmation,
    );
  }

  async sendActivatePhysicalCards(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName('Activate Physical Card')
      .setBody('Your physical card activate details')
      .setOriginText(this.getOriginEmail())
      .setDestinyText(message.destinyText)
      .setVars(message.vars)
      .build();
    return this.sendEmail(
      emailMessage,
      TemplatesMessageEnum.activatePhysicalCards,
    );
  }

  async sendDepositWalletReceived(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName('Deposit Wallet Received')
      .setBody('Your deposit wallet received details')
      .setOriginText(this.getOriginEmail())
      .setDestinyText(message.destinyText)
      .setVars(message.vars)
      .build();
    return this.sendEmail(emailMessage, TemplatesMessageEnum.depositReceived);
  }

  async sendRechargeCardReceived(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName('Recharge Card Received')
      .setBody('Your recharge card received details')
      .setOriginText(this.getOriginEmail())
      .setDestinyText(message.destinyText)
      .setVars(message.vars)
      .build();
    return this.sendEmail(emailMessage, TemplatesMessageEnum.cardRecharge);
  }

  async sendPreRegisterEmail(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName('Pre-registration Confirmation')
      .setBody('Thank you for pre-registering with B2pay.')
      .setOriginText(this.getOriginEmail())
      .setDestinyText(message.destinyText)
      .setVars(message.vars)
      .build();
    return this.sendEmail(emailMessage, TemplatesMessageEnum.preRegister);
  }

  async sendAdjustments(message: MessageCreateDto) {
    const getCard = await this.builder.getPromiseAccountEventClient(
      EventsNamesAccountEnum.findOneByCardId,
      { id: message.vars.cardId },
    );

    if (getCard && getCard.owner) {
      const user = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.findOneById,
        { _id: getCard.owner },
      );

      if (user && user.email) {
        const emailMessage = new EmailMessageBuilder()
          .setName('Ajuste de transacción')
          .setBody('Your card adjustments')
          .setOriginText(this.getOriginEmail())
          .setDestinyText(user.email)
          .setVars({
            ...message.vars,
            customerName: user.name,
          })
          .build();
        return this.sendEmail(emailMessage, TemplatesMessageEnum.adjustments);
      }
    }
  }
  async sendPurchases(message: MessageCreateDto) {
    /*  const transaction = await this.builder.getPromiseTransferEventClient(
       EventsNamesTransferEnum.findAll,
       {
         where: {
           "requestBodyJson.transaction.id": message.vars.transactionId
         }
       },
     ) */ //TODO: Nestor fee

    if (message.vars.transactionStatus !== 'REJECTED') {
      const getCard = await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.findOneByCardId,
        { id: message.vars.cardId },
      );
      if (getCard && getCard.owner) {
        const user = await this.builder.getPromiseUserEventClient(
          EventsNamesUserEnum.findOneById,
          { _id: getCard.owner },
        );
        if (user && user.email) {
          const emailMessage = new EmailMessageBuilder()
            .setName('Tu compra fue procesada correctamente 🚀')
            .setBody('Your recent purchases')
            .setOriginText(this.getOriginEmail())
            .setDestinyText(message?.destinyText ?? user.email)
            .setVars({
              ...message.vars,
              name: user.name,
              currency: 'USDT',
            })
            .build();
          return this.sendEmail(
            emailMessage,
            TemplatesMessageEnum.purchaseSuccessfullyApproved,
          );
        }
      }
    }
  }

  async sendCryptoWalletsManagement(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName(
        '¡Explora todo lo que puedes hacer con tu wallet! - Manejar tu vida financiera nunca habia sido tan sencillo.',
      )
      .setBody('Your crypto wallets management')
      .setOriginText(this.getOriginEmail())
      .setDestinyText(message.destinyText)
      .setVars(message.vars)
      .build();
    return this.sendEmail(
      emailMessage,
      TemplatesMessageEnum.cryptoWalletsManagement,
    );
  }

  async sendSecurityNotifications(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName('Security Notifications')
      .setBody('Your security notifications')
      .setOriginText(this.getOriginEmail())
      .setDestinyText(message.destinyText)
      .setVars(message.vars)
      .build();
    return this.sendEmail(
      emailMessage,
      TemplatesMessageEnum.securityNotifications,
    );
  }

  private async sendEmail(
    message: MessageCreateDto,
    template: TemplatesMessageEnum,
  ) {
    try {
      const recipient = message.destinyText;

      if (!isEmail(recipient)) {
        this.logger.error(
          `[sendEmail] Invalid recipient email address: ${recipient}`,
        );
        throw new Error('Invalid recipient email address');
      }

      const from = await this.configService.getOrThrow(
        'AWS_SES_FROM_DEFAULT',
        'no-reply@b2pay.app',
      );

      this.logger.info(
        `[sendEmail] Attempting to send email to ${recipient} using template ${template}`,
      );

      const html = this.compileHtml(message.vars ?? message, template);
      if (!html) {
        throw new Error('Failed to compile email template');
      }
      const mailOptions = {
        to: recipient,
        from,
        subject: message.name,
        text: message.body,
        template: template,
        context: message.vars,
        attachments: message.attachments,
        html,
      };

      await this.mailerService.sendMail(mailOptions);
      this.logger.info(`[sendEmail] Successfully sent email to ${recipient}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`[sendEmail] Failed to send email: ${error.message}`, {
        error,
        recipient: message.destinyText,
        template,
      });
      return { success: false, error: error.message };
    }
  }
  private compileHtml(vars: any, template: TemplatesMessageEnum) {
    const templateVars = {
      pageTitle: vars.name,
      headerColor: this.getHeaderColorForTemplate(template),
      headerTitle: vars.name,
      logoUrl: this.configService.getOrThrow('LOGO_URL'),
      socialMediaIcons: this.configService.getOrThrow('SOCIAL_MEDIA_ICONS'),
      socialMediaLinks: this.configService.getOrThrow('SOCIAL_MEDIA_LINKS'),
      vars: vars,
    };
    try {
      const rta = pug.renderFile(template, templateVars);
      return rta;
    } catch (error) {
      this.logger.error(
        `[compileHtml] Failed to render template: ${error.message}`,
      );
      throw new Error(`Failed to render email template: ${error.message}`);
    }
  }

  private getHeaderColorForTemplate(template: TemplatesMessageEnum): string {
    const colors = {
      [TemplatesMessageEnum.profileRegistrationCreation]: '#0056b3',
      [TemplatesMessageEnum.activatePhysicalCards]: '#28a745',
      [TemplatesMessageEnum.adjustments]: '#17a2b8',
      [TemplatesMessageEnum.cryptoWalletsManagement]: '#6f42c1',
    };
    return colors[template] || '#007bff';
  }
  async sendEmailDisclaimer(lead: LeadDocument) {
    if (lead.hasSendDisclaimer) {
      //throw new RpcException('Disclaimer has send');
      return true;
    }
    const domain = await this.getDomainCrm(lead.crm, true);
    try {
      if (domain) {
        await axios.post(this.url, {
          email: lead.email,
          domain: domain,
          name:
            lead.name ?? (lead.firstname ?? '') + ' ' + (lead.lastname ?? ''),
          apikey: this.apiKey,
        });
        this.builder.emitLeadEventClient(EventsNamesLeadEnum.updateOne, {
          id: lead._id,
          hasSendDisclaimer: true,
        });
        return true;
      }
      return null;
    } catch (err) {
      this.logger.error(`[sendEmailDisclaimer] error: ${err.message || err}`);
      return null;
    }
  }

  async getDomainCrm(crmId: Crm, triggerError = false): Promise<string> {
    const crm: CrmInterface = await this.builder.getPromiseCrmEventClient(
      EventsNamesCrmEnum.findOneById,
      crmId,
    );
    if (triggerError && !crm?.clientZone) {
      //throw new RpcException(`Domain ${crm.name} has not found`);
    }
    return crm?.clientZone;
  }
}
