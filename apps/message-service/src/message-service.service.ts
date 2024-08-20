import { BuildersService } from '@builder/builders';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { CrmInterface } from '@crm/crm/entities/crm.interface';
import { Crm } from '@crm/crm/entities/mongoose/crm.schema';
import { LeadDocument } from '@lead/lead/entities/mongoose/lead.schema';
import { MessageServiceMongooseService } from '@message/message';
import { MessageCreateDto } from '@message/message/dto/message.create.dto';
import { MessageUpdateDto } from '@message/message/dto/message.update.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import EventsNamesCrmEnum from 'apps/crm-service/src/enum/events.names.crm.enum';
import EventsNamesLeadEnum from 'apps/lead-service/src/enum/events.names.lead.enum';
import axios from 'axios';
import * as pug from 'pug';
import TemplatesMessageEnum from './enum/templates.message.enum';
import { isEmail } from 'class-validator';

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
    // TODO[hender] Not implemented download
    return Promise.resolve(undefined);
  }

  async sendEmailOtpNotification(message: MessageCreateDto) {
    return this.sendEmail(message, TemplatesMessageEnum.otpNotification);
  }

  async sendCardRequestConfirmationEmail(message: MessageCreateDto) {
    return this.sendEmail(
      message,
      TemplatesMessageEnum.cardRequestConfirmation,
    );
  }

  async sendProfileRegistrationCreation(message: MessageCreateDto) {
    return this.sendEmail(
      message,
      TemplatesMessageEnum.profileRegistrationCreation,
    );
  }

  async sendVirtualPhysicalCards(message: MessageCreateDto) {
    return this.sendEmail(message, TemplatesMessageEnum.virtualPhysicalCards);
  }

  async sendPurchasesTransactionAdjustments(message: MessageCreateDto) {
    return this.sendEmail(
      message,
      TemplatesMessageEnum.purchasesTransactionAdjustments,
    );
  }

  async sendCryptoWalletsManagement(message: MessageCreateDto) {
    return this.sendEmail(
      message,
      TemplatesMessageEnum.cryptoWalletsManagement,
    );
  }

  async sendSecurityNotifications(message: MessageCreateDto) {
    return this.sendEmail(message, TemplatesMessageEnum.securityNotifications);
  }

  async sendPasswordRestoredEmail(message: MessageCreateDto) {
    return this.sendEmail(
      message,
      TemplatesMessageEnum.passwordRestoredConfirmation,
    );
  }

  async sendEmail(message: MessageCreateDto, template: TemplatesMessageEnum) {
    let from = message.originText;
    if (!isEmail(from)) {
      from = await this.configService.get(
        'AWS_SES_FROM_DEFAULT',
        'noreply@email.com',
      );
      message.originText = from;
    }
    const msg = await this.newMessage(message);
    //send email
    await this.mailerService.sendMail({
      to: msg.destinyText,
      from,
      subject: msg.name,
      html: this.compileHtml(message.vars ?? message, template),
    });
    return msg;
  }
  private compileHtml(vars: any, template: TemplatesMessageEnum) {
    const templateVars = {
      pageTitle: vars.name,
      headerColor: this.getHeaderColorForTemplate(template),
      headerTitle: vars.name,
      logoUrl:
        'https://message-templates-resource.s3.eu-west-3.amazonaws.com/logo.svg',
      vars: vars,
    };

    const rta = pug.renderFile(template, templateVars);
    return rta;
  }

  private getHeaderColorForTemplate(template: TemplatesMessageEnum): string {
    const colors = {
      [TemplatesMessageEnum.profileRegistrationCreation]: '#0056b3',
      [TemplatesMessageEnum.virtualPhysicalCards]: '#28a745',
      [TemplatesMessageEnum.purchasesTransactionAdjustments]: '#17a2b8',
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

