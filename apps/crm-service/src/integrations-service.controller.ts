import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CrmServiceController } from './crm-service.controller';

@ApiTags('INTEGRATIONS')
@Controller('integrations')
export class IntegrationsServiceController extends CrmServiceController {}
