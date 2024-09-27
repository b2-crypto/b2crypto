import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { bootstrapGateway } from '@common/common/models/bootstrap.gateway';
import { IntegrationServiceModule } from './integration-service.module';

bootstrapGateway(IntegrationServiceModule, EnvironmentEnum.prod, 3001);
