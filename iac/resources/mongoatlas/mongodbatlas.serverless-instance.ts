import * as mongodbatlas from '@pulumi/mongodbatlas';
import {
  isProduction,
  isStressTest,
  mongoAtlasClusterName,
  SECRETS,
  TAGS,
} from '../../secrets';

export const mongodbatlasServerlessInstance =
  !isStressTest() && !isProduction()
    ? new mongodbatlas.ServerlessInstance(mongoAtlasClusterName, {
        name: mongoAtlasClusterName,
        projectId: SECRETS.MONGOATLAS_PROJECT_ID,
        providerSettingsRegionName: 'US_EAST_1',
        providerSettingsProviderName: 'AWS',
        terminationProtectionEnabled: isProduction(),
        stateName: 'IDLE',
        providerSettingsBackingProviderName: 'AWS',
        tags: Object.entries(TAGS).map(([key, value]) => ({
          key,
          value,
        })),
      })
    : null;
