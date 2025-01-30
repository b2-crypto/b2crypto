import { CrmDocument } from '@crm/crm/entities/mongoose/crm.schema';
import { AntelopeRegisterLeadDto } from '@integration/integration/crm/antelope-integration/dto/antelope-register-lead.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetDepositDto } from '../generic/dto/get-deposit.dto';
import { GetSalesStatusesDto } from '../generic/dto/get-sales-statuses.dto';
import { GetStatsDto } from '../generic/dto/get-stats.dto';
import { GetUserDto } from '../generic/dto/get-user.dto';
import { GetUsersDto } from '../generic/dto/get-users.dto';
import { RegenerateUserAutoLoginUrlDto } from '../generic/dto/regenerate-user-auto-login-url.dto';
import { RegisterUserDto } from '../generic/dto/register-user.dto';
import { SyncUserNoteDto } from '../generic/dto/sync-user-note-dto.dto';
import { SyncUserTransactionDto } from '../generic/dto/sync-user-transaction.dto';
import { TrackVisitDto } from '../generic/dto/track-visit.dto';
import { UserResponseDto } from '../generic/dto/user.response.dto';
import { IntegrationCrmService } from '../generic/integration.crm.service';
import { GetLeadDataFromCRMInterface } from '../generic/interface/get.lead.data.from.crm.interface';
import { AntelopeApiUserResultDto } from './result/antelope.api.user.result.dto';
import { AntelopeRegisterResultDto } from './result/antelope.register.result.dto';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class AntelopeIntegrationService
  extends IntegrationCrmService<
    // DTO
    TrackVisitDto,
    RegisterUserDto,
    AntelopeRegisterLeadDto,
    GetUserDto,
    GetUsersDto,
    SyncUserNoteDto,
    RegenerateUserAutoLoginUrlDto,
    GetDepositDto,
    SyncUserTransactionDto,
    GetStatsDto,
    GetSalesStatusesDto,
    // Results
    AntelopeRegisterResultDto
  >
  implements GetLeadDataFromCRMInterface
{
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    _crm: CrmDocument,
    protected configService: ConfigService,
  ) {
    super(logger, _crm, configService);
    //username, password, token, apiKey
    super.setRouteMap({
      generateApiKey: '/login',
      affiliateTrackVisit: '/trackVisit',
      affiliateRegisterUser: '/registerUser',
      affiliateRegisterLead: '/registerLead',
      affiliateGetUser: '/getUser',
      affiliateGetUsers: '/getUsers',
      affiliateSyncUserNote: '/syncUserNote',
      affiliateRegenerateUserAutoLoginUrl: '/regenerateUserAutologinUrl',
      affiliateGetDeposit: '/getDeposit',
      affiliateSyncUserTransaction: '/syncUserTransaction',
      affiliateGetStats: '/getStats',
      affiliateGetSalesStatuses: '/getSalesStatuses',
    });
  }
  async affiliateRegisterLead(
    registerLeadDto: AntelopeRegisterLeadDto,
  ): Promise<AntelopeRegisterResultDto | UserResponseDto> {
    const rta: AntelopeRegisterResultDto = (await super.affiliateRegisterLead(
      registerLeadDto,
    )) as AntelopeRegisterResultDto;
    return this.getLeadDataFromCRM(rta.result);
  }

  getLeadDataFromCRM(leadAntelope: AntelopeApiUserResultDto): UserResponseDto {
    const lead: UserResponseDto = {
      id: leadAntelope.userId.toString(),
      ...leadAntelope,
    };
    return lead;
  }
}
