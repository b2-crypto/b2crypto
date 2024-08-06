import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { CreateLeadAffiliateDto } from '@affiliate/affiliate/domain/dto/create-lead-affiliate.dto';
import { CrmDocument } from '@crm/crm/entities/mongoose/crm.schema';
import { AntelopeIntegrationService } from '@integration/integration/crm/antelope-integration/antelope-integration.service';
import { LeverateIntegrationService } from '@integration/integration/crm/leverate-integration/leverate-integration.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import IntegrationCardEnum from './card/enums/IntegrationCardEnum';
import { IntegrationCardService } from './card/generic/integration.card.service';
import { PomeloIntegrationService } from './card/pomelo-integration/pomelo-integration.service';
import { AntelopeRegisterLeadDto } from './crm/antelope-integration/dto/antelope-register-lead.dto';
import IntegrationCrmEnum from './crm/enums/IntegrationCrmEnum';
import { IntegrationCrmService } from './crm/generic/integration.crm.service';
import { RegisterLeadLeverateRequestDto } from './crm/leverate-integration/dto/register.lead.leverate.request.dto';
import { B2BinPayIntegrationService } from './crypto/b2binpay-integration/b2binpay-integration.service';
import IntegrationCryptoEnum from './crypto/enums/IntegrationCryptoEnum';
import { IntegrationCryptoService } from './crypto/generic/integration.crypto.service';
import { IntegrationIdentityEnum } from './identity/generic/domain/integration.identity.enum';
import { IntegrationIdentityService } from './identity/generic/integration.identity.service';

@Injectable()
export class IntegrationService {
  private env: string;
  constructor(private readonly configService: ConfigService) {
    this.env = configService.get('ENVIRONMENT');
  }

  async getIdentityIntegration(
    identityCategoryName: IntegrationIdentityEnum,
  ): Promise<IntegrationIdentityService> {
    return this.getIdentityType(identityCategoryName);
  }

  async getCardIntegration(
    cardCategoryName: IntegrationCardEnum,
    account?: AccountDocument,
  ): Promise<IntegrationCardService> {
    const cardType = this.getCardType(cardCategoryName, account);
    await cardType.generateHttp();
    return cardType;
  }

  async getCryptoIntegration(
    account: AccountDocument,
    cryptoCategoryName: string,
    url: string,
  ): Promise<IntegrationCryptoService> {
    const cryptoType = this.getCryptoType(cryptoCategoryName, account);
    cryptoType.setUrlBase(url);
    await cryptoType.generateHttp();
    return cryptoType;
  }

  async getCrmIntegration(
    crm: CrmDocument,
    crmCategoryName: string,
    url: string,
    username: string,
    password: string,
    apiKey: string,
    token: string,
  ): Promise<IntegrationCrmService> {
    const crmType = this.getCrmType(crmCategoryName, crm);
    //username,        password,        token,        apiKey,
    crmType.setToken(token);
    crmType.setUrlBase(url);
    crmType.setApiKey(apiKey);
    crmType.setUsername(username ?? crm.userCrm);
    crmType.setPassword(password ?? crm.passwordCrm);
    await crmType.generateHttp();
    return crmType;
  }

  getCrmRegisterLeadDto(
    crmCategoryName: string,
    leadDto: CreateLeadAffiliateDto,
  ) {
    switch (crmCategoryName.toUpperCase()) {
      case IntegrationCrmEnum.ANTELOPE:
        return new AntelopeRegisterLeadDto(leadDto);
      case IntegrationCrmEnum.LEVERATE:
        return new RegisterLeadLeverateRequestDto(leadDto);
    }
  }

  private getCrmType(
    crmCategoryName: string,
    crm: CrmDocument,
  ): IntegrationCrmService {
    let crmType: IntegrationCrmService;
    switch (crmCategoryName.toUpperCase()) {
      case IntegrationCrmEnum.ANTELOPE:
        crmType = new AntelopeIntegrationService(crm, this.configService);
        break;
      case IntegrationCrmEnum.LEVERATE:
        crmType = new LeverateIntegrationService(crm, this.configService);
        break;
    }
    if (!crmType) {
      throw new RpcException('The CRM "' + crmCategoryName + '" has not found');
    }
    return crmType;
  }

  private getIdentityType(
    identityCategoryName: IntegrationIdentityEnum,
  ): IntegrationIdentityService {
    let identityType: IntegrationIdentityService;
    switch (identityCategoryName.toUpperCase()) {
      case IntegrationIdentityEnum.SUMSUB:
        identityType = new IntegrationIdentityService({
          urlApi: 'https://api.sumsub.com/',
          token:
            'prd:4GTDd9lXlksugzFcLwvUPrer.06DQ3vvaaTDReWC6YhKSJqsCBlFeWRfU',
          privateKey: 'DQZbSZExLTNC7xX1FP2pcffonu4cDrzc',
        });
        break;
    }
    if (!identityType) {
      throw new RpcException(
        'The service "' + identityCategoryName + '" has not found',
      );
    }
    return identityType;
  }

  private getCardType(
    cardCategoryName: string,
    card?: AccountDocument,
  ): IntegrationCardService {
    let cardType: IntegrationCardService;
    switch (cardCategoryName.toUpperCase()) {
      case IntegrationCardEnum.POMELO:
        cardType = new PomeloIntegrationService(this.configService, card);
        break;
    }
    if (!cardType) {
      throw new RpcException(
        'The card "' + cardCategoryName + '" has not found',
      );
    }
    return cardType;
  }

  private getCryptoType(
    cryptoCategoryName: string,
    crypto: AccountDocument,
  ): IntegrationCryptoService {
    let cryptoType: IntegrationCryptoService;
    switch (cryptoCategoryName.toUpperCase()) {
      case IntegrationCryptoEnum.B2CORE:
        //cryptoType = new B2CoreIntegrationService(crypto, this.configService);
        break;
      case IntegrationCryptoEnum.B2BINPAY:
        cryptoType = new B2BinPayIntegrationService(crypto, this.configService);
        break;
    }
    if (!cryptoType) {
      throw new RpcException(
        'The crypto "' + cryptoCategoryName + '" has not found',
      );
    }
    return cryptoType;
  }
}
