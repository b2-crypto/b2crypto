import * as aws from '@pulumi/aws';
import { PROJECT_NAME, STACK } from '../../secrets';

export const ecsCluster = aws.ecs.getClusterOutput({
  clusterName: `${PROJECT_NAME}-${STACK}`,
});
