import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { CrmServiceController } from './crm-service.controller';

@ApiTags('INTEGRATIONS')
@Traceable()
@Controller('integrations')
export class IntegrationsServiceController extends CrmServiceController {}
