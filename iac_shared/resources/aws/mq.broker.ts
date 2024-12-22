import * as aws from '@pulumi/aws';
import {
  MQ_DEPLOYMENT_MODE,
  PROJECT_NAME,
  RABBIT_MQ_INSTANCE_TYPE,
  SECRETS,
  STACK,
  TAGS,
} from '../../secrets';
import { ec2Vpc } from './ec2.vpc';

export const mqBrokerRabbitMQ = new aws.mq.Broker(
  `${PROJECT_NAME}-rabbitmq-${STACK}`,
  {
    brokerName: `${PROJECT_NAME}-rabbit-${STACK}`,
    engineType: 'RABBITMQ',
    engineVersion: '4.0.5',
    hostInstanceType: RABBIT_MQ_INSTANCE_TYPE,
    publiclyAccessible: true,
    // securityGroups: [ec2SecurityGroup.id],
    users: [
      {
        username: SECRETS.RABBIT_MQ_USERNAME,
        password: SECRETS.RABBIT_MQ_PASSWORD,
      },
    ],
    subnetIds:
      MQ_DEPLOYMENT_MODE === 'CLUSTER_MULTI_AZ'
        ? ec2Vpc.publicSubnetIds
        : ec2Vpc.publicSubnetIds.apply((subnets) => [...subnets].slice(0, 1)),
    logs: {
      general: true,
      audit: false,
    },
    autoMinorVersionUpgrade: false,
    deploymentMode: MQ_DEPLOYMENT_MODE,
    authenticationStrategy: 'SIMPLE',
    tags: TAGS,
  },
  {
    // ignoreChanges: ['authenticationStrategy', 'engineType'],
    // protect: isProduction(),
  },
);
