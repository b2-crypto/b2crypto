import * as mongodbatlas from '@pulumi/mongodbatlas';
import {
  isStage,
  isTest,
  mongoAtlasClusterName,
  SECRETS,
  TAGS,
} from '../../secrets';

export const mongodbatlasServerlessInstance =
  isTest() || isStage()
    ? new mongodbatlas.ServerlessInstance(mongoAtlasClusterName, {
        name: mongoAtlasClusterName,
        projectId: SECRETS.MONGOATLAS_PROJECT_ID,
        providerSettingsRegionName: 'US_EAST_1',
        providerSettingsProviderName: 'AWS',
        terminationProtectionEnabled: true,
        continuousBackupEnabled: false,
        stateName: 'IDLE',
        providerSettingsBackingProviderName: 'AWS',
        tags: Object.entries(TAGS).map(([key, value]) => ({
          key,
          value,
        })),
      })
    : null;
