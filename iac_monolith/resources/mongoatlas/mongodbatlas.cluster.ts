import * as mongodbatlas from '@pulumi/mongodbatlas';
import {
  isProduction,
  isStressTest,
  PROJECT_NAME,
  SECRETS,
  STACK,
} from '../../secrets';

export const mongoAtlasCluster = isProduction()
  ? mongodbatlas.getClusterOutput({
      projectId: SECRETS.MONGOATLAS_PROJECT_ID,
      name: 'b2fintech',
    })
  : isStressTest()
  ? mongodbatlas.getClusterOutput({
      projectId: SECRETS.MONGOATLAS_PROJECT_ID,
      name: `${PROJECT_NAME}-monolith-${STACK}`,
    })
  : null;
