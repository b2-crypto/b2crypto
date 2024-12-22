import * as mongodbatlas from '@pulumi/mongodbatlas';
import {
  isProduction,
  isStressTest,
  PROJECT_NAME,
  SECRETS,
  STACK,
} from '../../secrets';

export const mongodbatlasServerlessInstance =
  !isStressTest() && !isProduction()
    ? mongodbatlas.getServerlessInstanceOutput({
        projectId: SECRETS.MONGOATLAS_PROJECT_ID,
        name: `${PROJECT_NAME}-monolith-${STACK}`,
      })
    : null;
