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

// export const mqBrokerRabbitMQ = isProduction()
//   ? aws.mq.getBrokerOutput(
//       {
//         brokerName: 'b2fintech',
//       },
//       {
//         provider: new aws.Provider('aws-us-west-1', {
//           region: 'us-west-1',
//           accessKey: SECRETS.ACCESS_KEY,
//           secretKey: SECRETS.SECRET_KEY,
//         }),
//       },
//     )
//   : new aws.mq.Broker(
//       `${PROJECT_NAME}-rabbitmq-${STACK}`,
//       {
//         brokerName: `${PROJECT_NAME}-rabbitmq-${STACK}`,
//         engineType: 'RABBITMQ',
//         engineVersion: '3.13',
//         hostInstanceType: RABBIT_MQ_INSTANCE_TYPE,
//         publiclyAccessible: true,
//         // securityGroups: [ec2SecurityGroup.id],
//         users: [
//           {
//             username: SECRETS.RABBIT_MQ_USERNAME,
//             password: SECRETS.RABBIT_MQ_PASSWORD,
//           },
//         ],
//         subnetIds:
//           MQ_DEPLOYMENT_MODE === 'SINGLE_INSTANCE'
//             ? ec2Vpc.publicSubnetIds.apply((subnets) =>
//                 [...subnets].slice(0, 1),
//               )
//             : [],
//         logs: {
//           general: true,
//           audit: false,
//         },
//         autoMinorVersionUpgrade: true,
//         deploymentMode: MQ_DEPLOYMENT_MODE,
//         authenticationStrategy: 'SIMPLE',
//         tags: TAGS,
//       },
//       {
//         // protect: isProduction(),
//       },
//     );

export const mqBrokerRabbitMQ = new aws.mq.Broker(
  `${PROJECT_NAME}-rabbitmq-${STACK}`,
  {
    brokerName: `${PROJECT_NAME}-rabbitmq-${STACK}`,
    engineType: 'RABBITMQ',
    engineVersion: '3.13',
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
    autoMinorVersionUpgrade: true,
    deploymentMode: MQ_DEPLOYMENT_MODE,
    authenticationStrategy: 'SIMPLE',
    tags: TAGS,
  },
  {
    // protect: isProduction(),
  },
);
