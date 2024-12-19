import * as aws from '@pulumi/aws';
import { isProduction, PROJECT_NAME, SECRETS, STACK } from '../../secrets';

export const mqBrokerRabbitMQ = isProduction()
  ? aws.mq.getBrokerOutput(
      {
        brokerName: 'b2fintech',
      },
      {
        provider: new aws.Provider('aws-us-west-1', {
          region: 'us-west-1',
          accessKey: SECRETS.AWS_ACCESS_KEY,
          secretKey: SECRETS.AWS_SECRET_KEY,
        }),
      },
    )
  : aws.mq.getBrokerOutput({
      brokerName: `${PROJECT_NAME}-rabbitmq-${STACK}`,
    });
