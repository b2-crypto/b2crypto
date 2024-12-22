import * as aws from '@pulumi/aws';
import { PROJECT_NAME, STACK } from '../../secrets';

export const mqBrokerRabbitMQ = aws.mq.getBrokerOutput({
  brokerName: `${PROJECT_NAME}-rabbit-${STACK}`,
});
