import { CreateLeadAffiliateDto } from '@affiliate/affiliate/domain/dto/create-lead-affiliate.dto';
import { CrmDocument } from '@crm/crm/entities/mongoose/crm.schema';
import { AntelopeIntegrationService } from '@integration/integration/crm/antelope-integration/antelope-integration.service';
import { LeverateIntegrationService } from '@integration/integration/crm/leverate-integration/leverate-integration.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { AntelopeRegisterLeadDto } from './crm/antelope-integration/dto/antelope-register-lead.dto';
import IntegrationCrmEnum from './crm/enums/IntegrationCrmEnum';
import { IntegrationCrmService } from './crm/generic/integration.crm.service';
import { RegisterLeadLeverateRequestDto } from './crm/leverate-integration/dto/register.lead.leverate.request.dto';
import IntegrationCryptoEnum from './crypto/enums/IntegrationCrmEnum';
import { IntegrationCardService } from './card/generic/integration.card.service';
import IntegrationCardEnum from './card/enums/IntegrationCardEnum';
import { IntegrationCryptoService } from './crypto/generic/integration.crypto.service';
import { ClientCardDto } from './card/generic/dto/client.card.dto';
import { PomeloIntegrationService } from './card/pomelo-integration/pomelo-integration.service';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';

@Injectable()
export class IntegrationService {
  private env: string;
  constructor(private readonly configService: ConfigService) {
    this.env = configService.get('ENVIRONMENT');
  }

  async getCardIntegration(
    account: AccountDocument,
    cardCategoryName: IntegrationCardEnum,
  ): Promise<IntegrationCardService> {
    const cardType = this.getCardType(cardCategoryName, account);
    cardType.setToken(
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InAyOHhHM041MFBiNG93bTBZVHAxaCJ9.eyJodHRwczovL3BvbWVsby5sYS9jbGllbnRfaWQiOiJjbGktMlZiRkdsMUJmWXNCVEJpY0MzV1hINk9Ddno4IiwiaXNzIjoiaHR0cHM6Ly9wb21lbG8tc3RhZ2UudXMuYXV0aDAuY29tLyIsInN1YiI6IkJQZGFWamhkSkF5elBXNDNKSTdZVU0xY3pOb1RQaDJHQGNsaWVudHMiLCJhdWQiOiJodHRwczovL2F1dGgtc3RhZ2luZy5wb21lbG8ubGEiLCJpYXQiOjE3MTYzNzg2MzAsImV4cCI6MTcxNjQ2NTAzMCwic2NvcGUiOiJtZXg6Y2FyZHMgY29sOmNhcmRzIHVzZXJzOmdldC11c2VyIHVzZXJzOnVwZGF0ZS11c2VyIHVzZXJzOnNlYXJjaC11c2VyIHVzZXJzOmNyZWF0ZS11c2VyIGNhcmRzOmNyZWF0ZS1jYXJkIGNhcmRzOmdldC1jYXJkIGNhcmRzOmFjdGl2YXRlLWNhcmQgY2FyZHM6Y3JlYXRlLWJhdGNoIGNhcmRzOnNlYXJjaC1jYXJkIGNhcmRzOnVwZGF0ZS1jYXJkIHNoaXBtZW50OmdldC1zaGlwbWVudCBzaGlwbWVudDpjcmVhdGUtc2hpcG1lbnQgc2hpcG1lbnQ6c2VhcmNoLXNoaXBtZW50IHNoaXBtZW50OnVwZGF0ZS1zaGlwbWVudCBpc3N1aW5nLWNvbmZpZzpjcmVhdGUtcHJvZHVjdCBpc3N1aW5nLWNvbmZpZzpnZXQtcHJvZHVjdCBpc3N1aW5nLWNvbmZpZzp1cGRhdGUtcHJvZHVjdCBpc3N1aW5nLWNvbmZpZzpzZWFyY2gtcHJvZHVjdCBpc3N1aW5nLWNvbmZpZzpjcmVhdGUtYWZmaW5pdHktZ3JvdXAgaXNzdWluZy1jb25maWc6Z2V0LWFmZmluaXR5LWdyb3VwIGlzc3VpbmctY29uZmlnOnVwZGF0ZS1hZmZpbml0eS1ncm91cCBpc3N1aW5nLWNvbmZpZzpzZWFyY2gtYWZmaW5pdHktZ3JvdXAgY29tcGFuaWVzOnNlYXJjaC1jb21wYW55IG1kZXMtY29ubmVjdG9yOmdlbmVyYXRlLWFwcGxlLXByb3Zpc2lvbmluZy1kYXRhIHRocmVlZHMtY29ubmVjdG9yOnNlbmQtb3RwIG1kZXMtY29ubmVjdG9yOmdlbmVyYXRlLWdvb2dsZS1wcm92aXNpb25pbmctZGF0YSIsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyIsImF6cCI6IkJQZGFWamhkSkF5elBXNDNKSTdZVU0xY3pOb1RQaDJHIn0.zbGb6kTC3C8SRZWHYmKUv9oESchHsXCTHlNTqTNH5V85R_x-IzLGKBY268clIc7mB_qqm7UiOcULzExmUrnzJUpem5Csk-N-ODd_mq3aBhm9QL-0ELlXuRmIE2b2KuVaoVwRohia-U-M0FJfpKE6JggqRLzBGKfnXLgRvJgXFklEB7tCeJs93Mp1aOWaQ39PuhfJdo6jdYWe9T8u2Mw5IrND2-cw8YfAogqO7DZL8XxNkI2h6lFZLUr7Aw9jnC7Lgypf_nRA7hC52ySxaXanKB7wh4wy2R2q0xyEK8QrOxUoxyYQ74qTrnpcen5PmOZA4d843Xrn2-2qDl7OSe2cNQ',
    );
    await cardType.generateHttp();
    return cardType;
  }

  async getCryptoIntegration(
    account: CrmDocument,
    cryptoCategoryName: string,
    url: string,
    username: string,
    password: string,
    apiKey: string,
    token: string,
  ): Promise<IntegrationCryptoService> {
    const cryptoType = this.getCryptoType(cryptoCategoryName, account);
    cryptoType.setToken(token);
    cryptoType.setUrlBase(url);
    cryptoType.setApiKey(apiKey);
    cryptoType.setUsername(username ?? account.userCrm);
    cryptoType.setPassword(password ?? account.passwordCrm);
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

  private getCardType(
    cardCategoryName: string,
    card: AccountDocument,
  ): IntegrationCardService {
    let cardType: IntegrationCardService;
    switch (cardCategoryName.toUpperCase()) {
      case IntegrationCardEnum.POMELO:
        cardType = new PomeloIntegrationService(card, this.configService);
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
    crypto: CrmDocument,
  ): IntegrationCryptoService {
    let cryptoType: IntegrationCryptoService;
    switch (cryptoCategoryName.toUpperCase()) {
      case IntegrationCryptoEnum.B2CORE:
        //cryptoType = new B2CoreIntegrationService(crypto, this.configService);
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
