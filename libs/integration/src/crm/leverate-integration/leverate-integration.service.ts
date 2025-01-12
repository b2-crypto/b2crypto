import { CrmDocument } from '@crm/crm/entities/mongoose/crm.schema';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { TransferInterface } from '@transfer/transfer/entities/transfer.interface';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CrmGenerateTokenResponseDto } from '../generic/dto/crm.generate.token.response.dto';
import { GenerateTokenCrmRequestDto } from '../generic/dto/generate.token.crm.dto';
import { GetDepositDto } from '../generic/dto/get-deposit.dto';
import { GetSalesStatusesDto } from '../generic/dto/get-sales-statuses.dto';
import { GetStatsDto } from '../generic/dto/get-stats.dto';
import { GetUserDto } from '../generic/dto/get-user.dto';
import { GetUsersDto } from '../generic/dto/get-users.dto';
import { RegenerateUserAutoLoginUrlDto } from '../generic/dto/regenerate-user-auto-login-url.dto';
import { RegisterPaymentDto } from '../generic/dto/register-payment.dto';
import { RegisterUserDto } from '../generic/dto/register-user.dto';
import { SyncUserNoteDto } from '../generic/dto/sync-user-note-dto.dto';
import { SyncUserTransactionDto } from '../generic/dto/sync-user-transaction.dto';
import { TrackVisitDto } from '../generic/dto/track-visit.dto';
import { UpdatePaymentDto } from '../generic/dto/update.payment.dto';
import { UserResponseDto } from '../generic/dto/user.response.dto';
import { IntegrationCrmService } from '../generic/integration.crm.service';
import { GenerateCrmTokenInterface } from '../generic/interface/generate.crm.token.interface';
import { GetLeadDataFromCRMInterface } from '../generic/interface/get.lead.data.from.crm.interface';
import { AssignLeadLeverateRequestDto } from './dto/assign.lead.leverate.request.dto';
import { MonetaryTransactionRequestLeverateDto } from './dto/create.monetary.transaction.request.dto';
import { LeadAccountDetailsResponse } from './dto/lead.account.details.response.dto';
import { RegisterLeadLeverateRequestDto } from './dto/register.lead.leverate.request.dto';
import { InfoResponseLeverateDto } from './dto/result.response.leverate.dto';
import { LeverateRegisterResponseDto } from './result/leverate.register.response.dto';
import { LeverateRegenerateUserAutoLoginUrlDto } from './result/regenerate-user-auto-login-url.response';

import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class LeverateIntegrationService
  extends IntegrationCrmService<
    // DTO
    TrackVisitDto,
    RegisterUserDto,
    RegisterLeadLeverateRequestDto,
    RegisterPaymentDto,
    UpdatePaymentDto,
    GetUserDto,
    GetUsersDto,
    SyncUserNoteDto,
    RegenerateUserAutoLoginUrlDto,
    GetDepositDto,
    SyncUserTransactionDto,
    GetStatsDto,
    GetSalesStatusesDto,
    // Results
    LeverateRegisterResponseDto,
    InfoResponseLeverateDto,
    LeadAccountDetailsResponse
  >
  implements GetLeadDataFromCRMInterface, GenerateCrmTokenInterface
{
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    _crm: CrmDocument,
    protected configService: ConfigService,
  ) {
    super(logger, _crm, configService);
    super.setRouteMap({
      // Affiliate
      generateApiKey: '',
      affiliateRegisterLead: '',
      affiliateAssignLead: '',
      affiliateGetUsers: '',
      affiliateRegenerateUserAutoLoginUrl: '',
      affiliateGetDeposit: '',
      // Monetary Transaction
      crmAccountDetails: '',
      crmGenerateToken: '',
      crmCreateWithdrawalRequest: '',
      crmCreateCreaditCardDepositRequest: '',
      crmCreateMonetaryTransactionRequest: '',
      crmCreateWithdrawalCancellationTransactionStatusRequest: '',
      crmGetMonetaryTransactionPerTPAccountRequest: '',
      // Payment Transaction
      crmCreatePaymentTransaction: '',
      crmUpdatePaymentTransaction: '',
    });
  }

  async crmLeadAccountDetails(
    leadTpName: string,
  ): Promise<LeadAccountDetailsResponse> {
    await this.generateCrmToken({
      organization: this.crm.organizationCrm,
      id: this.crm.idCrm,
      secret: this.crm.secretCrm,
    });
    super.setTokenCrm(this.tokenCrm);
    return super.crmLeadAccountDetails(leadTpName);
  }

  async generateCrmToken(
    data: GenerateTokenCrmRequestDto,
  ): Promise<CrmGenerateTokenResponseDto> {
    //if (true) {
    if (!this.crm.token || this.hasTokenCrmExpired(this.crm.expTimeToken)) {
      const url = `${super.getRouteMap().crmGenerateToken}/${
        data.organization
      }/${data.id}/${data.secret}`;
      try {
        const rta: CrmGenerateTokenResponseDto = await this.http.get(url);
        this.crm.token = rta.data.token;
        this.crm.expTimeToken = new Date(rta.data.expTime);
        await this.crm.save();
      } catch (err) {
        this.logger.error(
          `${LeverateIntegrationService.name}:generateCrmToken`,
          `${url}`,
        );
        this.logger.error(LeverateIntegrationService.name, `${url}`);
        this.logger.error(LeverateIntegrationService.name, err);
      }
    }
    super.setTokenCrm(this.crm.token);
    return new CrmGenerateTokenResponseDto({
      token: this.crm?.token,
      expTime: this.crm?.expTimeToken,
    });
  }

  hasTokenCrmExpired(expTimeToken) {
    if (expTimeToken) {
      const expire = new Date(expTimeToken);
      const now = new Date();
      this.logger.debug(
        'Has expired crm token',
        expire.getTime() <= now.getTime(),
      );
      return expire.getTime() <= now.getTime();
    }
    return true;
  }

  async crmRegisterPayment(
    transfer: TransferInterface,
  ): Promise<InfoResponseLeverateDto> {
    this.logger.warn(
      'crmCreateDeposit',
      `Transfer ${transfer._id} - ${transfer.numericId}`,
    );
    await this.generateCrmToken({
      organization: this.crm.organizationCrm,
      id: this.crm.idCrm,
      secret: this.crm.secretCrm,
    });
    const registerPaymentDto = new MonetaryTransactionRequestLeverateDto(
      transfer,
    );
    const rta = await super.crmRegisterPayment(registerPaymentDto);
    return rta['result'] as InfoResponseLeverateDto;
  }

  async crmCreateWithdrawal(
    transfer: TransferInterface,
  ): Promise<InfoResponseLeverateDto> {
    this.logger.warn(
      'crmCreateWithdrawal',
      `Transfer ${transfer._id} - ${transfer.numericId}`,
    );
    await this.generateCrmToken({
      organization: this.crm.organizationCrm,
      id: this.crm.idCrm,
      secret: this.crm.secretCrm,
    });
    const registerPaymentDto = new MonetaryTransactionRequestLeverateDto(
      transfer,
    );
    return super.crmRegisterPayment(registerPaymentDto);
  }
  async crmCreateCredit(
    transfer: TransferInterface,
  ): Promise<InfoResponseLeverateDto> {
    this.logger.warn(
      'crmCreateCredit',
      `Transfer ${transfer._id} - ${transfer.numericId}`,
    );
    await this.generateCrmToken({
      organization: this.crm.organizationCrm,
      id: this.crm.idCrm,
      secret: this.crm.secretCrm,
    });
    const registerPaymentDto = new MonetaryTransactionRequestLeverateDto(
      transfer,
    );
    return super.crmRegisterPayment(registerPaymentDto);
  }

  async affiliateAssignLead(
    assignLeadDto: AssignLeadLeverateRequestDto,
  ): Promise<LeverateRegisterResponseDto> {
    await this.generateCrmToken({
      organization: this.crm.organizationCrm,
      id: this.crm.idCrm,
      secret: this.crm.secretCrm,
    });
    const rta: LeverateRegisterResponseDto = await super.affiliateAssignLead(
      assignLeadDto,
    );
    return rta;
  }

  async affiliateRegisterLead(
    registerLeadDto: RegisterLeadLeverateRequestDto,
  ): Promise<LeverateRegisterResponseDto> {
    const leadRta = await super.affiliateRegisterLead(registerLeadDto);
    return (
      leadRta &&
      (this.getLeadDataFromCRM(leadRta) as LeverateRegisterResponseDto)
    );
  }

  async affiliateRegenerateUserAutoLoginUrl(
    regenerateUserAutoLoginUrlDto: RegenerateUserAutoLoginUrlDto,
  ): Promise<LeverateRegenerateUserAutoLoginUrlDto> {
    const rta: LeverateRegenerateUserAutoLoginUrlDto =
      (await super.affiliateRegenerateUserAutoLoginUrl(
        regenerateUserAutoLoginUrlDto,
      )) as unknown as LeverateRegenerateUserAutoLoginUrlDto;
    const urlBase = this.crm.clientZone
      .replace('https://', '')
      .replace('http://', '');
    if (rta?.jwt) {
      rta.url = `https://${urlBase}/?ssoToken=${rta?.jwt}`;
      return rta;
    }
    throw new NotFoundException(
      `Not found ${regenerateUserAutoLoginUrlDto.email}`,
    );
  }

  getLeadDataFromCRM(
    leadLeverate: LeverateRegisterResponseDto,
  ): UserResponseDto {
    const lead: UserResponseDto = {
      id: leadLeverate.tpAccountName || leadLeverate.accountId,
      accountId: leadLeverate.accountId,
      accountPassword: leadLeverate.tpAccountPassword,
      ...leadLeverate,
    };
    if (!lead.id) {
      throw new RpcException(lead);
    }
    return lead;
  }
}
