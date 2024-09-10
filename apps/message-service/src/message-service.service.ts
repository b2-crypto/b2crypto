import { BuildersService } from '@builder/builders';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { MessageServiceMongooseService } from '@message/message';
import { MessageCreateDto } from '@message/message/dto/message.create.dto';
import { MessageUpdateDto } from '@message/message/dto/message.update.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailMessageBuilder } from './email-message.builder';
import TemplatesMessageEnum from './enum/templates.message.enum';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { isEmail } from 'class-validator';
import EventsNamesCrmEnum from 'apps/crm-service/src/enum/events.names.crm.enum';
import { Crm } from '@crm/crm/entities/mongoose/crm.schema';
import { CrmInterface } from '@crm/crm/entities/crm.interface';
import EventsNamesLeadEnum from 'apps/lead-service/src/enum/events.names.lead.enum';
import axios from 'axios';
import { LeadDocument } from '@lead/lead/entities/mongoose/lead.schema';
import * as pug from 'pug';

@Injectable()
export class MessageServiceService {
  private apiKey: string;
  private url: string;

  constructor(
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
    return this.configService.get(
      'AWS_SES_FROM_DEFAULT',
      'no-reply@b2crypto.com',
    );
  }

  async sendEmailOtpNotification(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName('OTP Notification')
      .setBody(`Your OTP code is ${message.vars.otp}`)
      .setOriginText(this.getOriginEmail())
      .setDestinyText(message.destinyText)
      .setVars(message.vars)
      .build();
    return this.sendEmail(emailMessage, TemplatesMessageEnum.otpNotification);
  }

  async sendCardRequestConfirmationEmail(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName('Card Request Confirmation')
      .setBody('Your card request has been confirmed')
      .setOriginText(this.getOriginEmail())
      .setDestinyText(message.destinyText)
      .setVars(message.vars)
      .build();
    return this.sendEmail(
      emailMessage,
      TemplatesMessageEnum.cardRequestConfirmation,
    );
  }

  async sendProfileRegistrationCreation(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName('Profile Registration Creation')
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

  async sendPasswordRestoredEmail(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName('Password Restored')
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

  async sendVirtualPhysicalCards(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName('Virtual/Physical Cards')
      .setBody('Your virtual/physical card details')
      .setOriginText(this.getOriginEmail())
      .setDestinyText(message.destinyText)
      .setVars(message.vars)
      .build();
    return this.sendEmail(
      emailMessage,
      TemplatesMessageEnum.virtualPhysicalCards,
    );
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
          .setName('Adjustments')
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
          .setName('Purchases')
          .setBody('Your recent purchases')
          .setOriginText(this.getOriginEmail())
          .setDestinyText(user.email)
          .setVars({
            ...message.vars,
            customerName: user.name,
          })
          .build();
        return this.sendEmail(emailMessage, TemplatesMessageEnum.purchases);
      }
    }
  }

  async sendCryptoWalletsManagement(message: MessageCreateDto) {
    const emailMessage = new EmailMessageBuilder()
      .setName('Crypto Wallets Management')
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
        throw new Error('Invalid recipient email address');
      }

      const from = await this.configService.get(
        'AWS_SES_FROM_DEFAULT',
        'no-reply@b2crypto.com',
      );
      const html = this.compileHtml(message.vars ?? message, template);

      await this.mailerService.sendMail({
        to: recipient,
        from,
        subject: message.name,
        text: message.body,
        template: template,
        context: message.vars,
        html,
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }
  private compileHtml(vars: any, template: TemplatesMessageEnum) {
    const templateVars = {
      pageTitle: vars.name,
      headerColor: this.getHeaderColorForTemplate(template),
      headerTitle: vars.name,
      logoUrl: process.env.LOGO_URL,
      vars: vars,
    };

    const rta = pug.renderFile(template, templateVars);
    return rta;
  }

  private getHeaderColorForTemplate(template: TemplatesMessageEnum): string {
    const colors = {
      [TemplatesMessageEnum.profileRegistrationCreation]: '#0056b3',
      [TemplatesMessageEnum.virtualPhysicalCards]: '#28a745',
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
        const rta = await axios.post(this.url, {
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
      Logger.error(err, 'Error sending email');
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
