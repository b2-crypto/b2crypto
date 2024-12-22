import * as aws from '@pulumi/aws';
import { PROJECT_NAME, STACK, TAGS } from '../../secrets';

export const cloudwatchLogGroupOptlCollector = new aws.cloudwatch.LogGroup(
  `${PROJECT_NAME}-optl-collector-${STACK}`,
  {
    name: `${PROJECT_NAME}/ecs/task/optl-collector-${STACK}`,
    retentionInDays: 30,
    tags: TAGS,
  },
);

export const cloudwatchLogGroupOptlUi = new aws.cloudwatch.LogGroup(
  `${PROJECT_NAME}-optl-ui-${STACK}`,
  {
    name: `${PROJECT_NAME}/ecs/task/optl-ui-${STACK}`,
    retentionInDays: 30,
    tags: TAGS,
  },
);
