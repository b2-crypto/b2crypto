import * as mongodbatlas from '@pulumi/mongodbatlas';
import {
  isProduction,
  isStressTest,
  mongoAtlasClusterName,
  SECRETS,
} from '../../secrets';

export const mongodbatlasServerlessInstance =
  !isStressTest() && !isProduction()
    ? mongodbatlas.getServerlessInstanceOutput({
        projectId: SECRETS.MONGOATLAS_PROJECT_ID,
        name: mongoAtlasClusterName,
      })
    : null;
