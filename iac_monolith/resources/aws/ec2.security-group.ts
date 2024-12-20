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
    vpcId: ec2Vpc.id,
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
