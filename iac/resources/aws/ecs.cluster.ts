import * as aws from '@pulumi/aws';
import { PROJECT_NAME, STACK, TAGS } from '../../secrets';

export const ecsCluster = new aws.ecs.Cluster(`${PROJECT_NAME}-${STACK}`, {
  name: `${PROJECT_NAME}-${STACK}`,
  tags: TAGS,
});
