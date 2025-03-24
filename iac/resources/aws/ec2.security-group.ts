import * as aws from '@pulumi/aws';
import {
  PORT,
  PROJECT_NAME,
  RABBIT_MQ_PORT,
  REDIS_PORT,
  STACK,
  TAGS,
} from '../../secrets';
import { ec2Vpc } from './ec2.vpc';

export const ec2SecurityGroup = new aws.ec2.SecurityGroup(
  `${PROJECT_NAME}-monolith-${STACK}`,
  {
    name: `${PROJECT_NAME}-monolith-${STACK}`,
    description: 'Security group for Monolith',
    vpcId: ec2Vpc.vpcId,
    ingress: [
      {
        fromPort: 443,
        toPort: 443,
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        fromPort: parseInt(PORT),
        toPort: parseInt(PORT),
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        fromPort: parseInt(RABBIT_MQ_PORT),
        toPort: parseInt(RABBIT_MQ_PORT),
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        fromPort: parseInt(REDIS_PORT),
        toPort: parseInt(REDIS_PORT),
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: TAGS,
  },
);

export const ec2SecurityGroupRedis = new aws.ec2.SecurityGroup(
  `${PROJECT_NAME}-security-group-${STACK}`,
  {
    name: `${PROJECT_NAME}-security-group-${STACK}`,
    vpcId: ec2Vpc.vpcId,
    description: 'Security group for Redis',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: parseInt(REDIS_PORT),
        toPort: parseInt(REDIS_PORT),
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: TAGS,
  },
);

// export const ec2SecurityGroupOptlCollector = new aws.ec2.SecurityGroup(
//   `${PROJECT_NAME}-optl-collector-${STACK}`,
//   {
//     name: `${PROJECT_NAME}-optl-collector-${STACK}`,
//     vpcId: ec2Vpc.vpcId,
//     ingress: [
//       {
//         protocol: 'TCP',
//         fromPort: 4318,
//         toPort: 4318,
//         cidrBlocks: ['0.0.0.0/0'],
//       },
//       {
//         protocol: 'TCP',
//         fromPort: 14269,
//         toPort: 14269,
//         cidrBlocks: ['0.0.0.0/0'],
//       },
//       {
//         protocol: 'TCP',
//         fromPort: 443,
//         toPort: 443,
//         cidrBlocks: ['0.0.0.0/0'],
//       },
//     ],
//     egress: [
//       {
//         protocol: 'TCP',
//         fromPort: 4318,
//         toPort: 4318,
//         cidrBlocks: ['0.0.0.0/0'],
//       },
//       {
//         protocol: 'TCP',
//         fromPort: 14269,
//         toPort: 14269,
//         cidrBlocks: ['0.0.0.0/0'],
//       },
//       {
//         protocol: 'TCP',
//         fromPort: 443,
//         toPort: 443,
//         cidrBlocks: ['0.0.0.0/0'],
//       },
//     ],
//     tags: TAGS,
//   },
// );

// export const ec2SecurityGroupOptlUi = new aws.ec2.SecurityGroup(
//   `${PROJECT_NAME}-optl-ui-${STACK}`,
//   {
//     name: `${PROJECT_NAME}-optl-ui-${STACK}`,
//     vpcId: ec2Vpc.vpcId,
//     ingress: [
//       {
//         protocol: 'TCP',
//         fromPort: 16686,
//         toPort: 16686,
//         cidrBlocks: ['0.0.0.0/0'],
//       },
//       {
//         protocol: 'TCP',
//         fromPort: 16687,
//         toPort: 16687,
//         cidrBlocks: ['0.0.0.0/0'],
//       },
//       {
//         protocol: 'TCP',
//         fromPort: 443,
//         toPort: 443,
//         cidrBlocks: ['0.0.0.0/0'],
//       },
//     ],
//     egress: [
//       {
//         protocol: 'TCP',
//         fromPort: 16686,
//         toPort: 16686,
//         cidrBlocks: ['0.0.0.0/0'],
//       },
//       {
//         protocol: 'TCP',
//         fromPort: 16687,
//         toPort: 16687,
//         cidrBlocks: ['0.0.0.0/0'],
//       },
//       {
//         protocol: 'TCP',
//         fromPort: 443,
//         toPort: 443,
//         cidrBlocks: ['0.0.0.0/0'],
//       },
//     ],
//     tags: TAGS,
//   },
// );

// export const ec2SecurityGroupOptlOpensearch = new aws.ec2.SecurityGroup(
//   `${PROJECT_NAME}-optl-opensearch-${STACK}`,
//   {
//     name: `${PROJECT_NAME}-optl-opensearch-${STACK}`,
//     vpcId: ec2Vpc.vpcId,
//     ingress: [
//       {
//         protocol: '-1',
//         fromPort: 0,
//         toPort: 0,
//         cidrBlocks: ['0.0.0.0/0'],
//         securityGroups: [
//           ec2SecurityGroupOptlCollector.id,
//           ec2SecurityGroupOptlUi.id,
//         ],
//       },
//     ],
//     egress: [
//       {
//         protocol: '-1',
//         fromPort: 0,
//         toPort: 0,
//         cidrBlocks: ['0.0.0.0/0'],
//       },
//     ],
//     tags: TAGS,
//   },
// );
