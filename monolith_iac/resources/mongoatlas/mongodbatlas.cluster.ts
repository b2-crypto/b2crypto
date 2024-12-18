import * as mongodbatlas from '@pulumi/mongodbatlas';
import {
  isProduction,
  isStressTest,
  mongoAtlasClusterName,
  SECRETS,
} from '../../secrets';

export const mongoAtlasCluster = isProduction()
  ? mongodbatlas.getClusterOutput({
      projectId: SECRETS.MONGOATLAS_PROJECT_ID,
      name: 'b2fintech',
    })
  : isStressTest()
  ? mongodbatlas.getClusterOutput({
      projectId: SECRETS.MONGOATLAS_PROJECT_ID,
      name: mongoAtlasClusterName,
    })
  : null;
