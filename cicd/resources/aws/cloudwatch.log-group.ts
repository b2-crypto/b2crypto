import * as aws from '@pulumi/aws';
import { PROJECT_NAME, STACK, TAGS } from '../../secrets';

export const cloudwatchLogGroup = new aws.cloudwatch.LogGroup(
  `${PROJECT_NAME}-monolith-${STACK}`,
  {
    name: `${PROJECT_NAME}/ecs/task/monolith-${STACK}`,
    retentionInDays: 30,
    tags: TAGS,
  },
);
