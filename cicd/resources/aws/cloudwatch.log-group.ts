import * as aws from '@pulumi/aws';
import { PROJECT_NAME, STACK } from '../../secrets';

export const cloudwatchLogGroup = aws.cloudwatch.getLogGroupOutput({
  name: `${PROJECT_NAME}/ecs/task/${STACK}`,
});
