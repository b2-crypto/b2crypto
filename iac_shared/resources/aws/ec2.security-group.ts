import * as aws from '@pulumi/aws';
import { PROJECT_NAME, STACK, TAGS } from '../../secrets';
import { ec2Vpc } from './ec2.vpc';

export const ec2SecurityGroupOptlCollector = new aws.ec2.SecurityGroup(
  `${PROJECT_NAME}-optl-collector-${STACK}`,
  {
    name: `${PROJECT_NAME}-optl-collector-${STACK}`,
    vpcId: ec2Vpc.vpcId,
    ingress: [
      {
        protocol: 'TCP',
        fromPort: 4318,
        toPort: 4318,
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        protocol: 'TCP',
        fromPort: 14269,
        toPort: 14269,
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        protocol: 'TCP',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    egress: [
      {
        protocol: 'TCP',
        fromPort: 4318,
        toPort: 4318,
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        protocol: 'TCP',
        fromPort: 14269,
        toPort: 14269,
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        protocol: 'TCP',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: TAGS,
  },
);

export const ec2SecurityGroupOptlUi = new aws.ec2.SecurityGroup(
  `${PROJECT_NAME}-optl-ui-${STACK}`,
  {
    name: `${PROJECT_NAME}-optl-ui-${STACK}`,
    vpcId: ec2Vpc.vpcId,
    ingress: [
      {
        protocol: 'TCP',
        fromPort: 16686,
        toPort: 16686,
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        protocol: 'TCP',
        fromPort: 16687,
        toPort: 16687,
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        protocol: 'TCP',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    egress: [
      {
        protocol: 'TCP',
        fromPort: 16686,
        toPort: 16686,
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        protocol: 'TCP',
        fromPort: 16687,
        toPort: 16687,
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        protocol: 'TCP',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: TAGS,
  },
);

export const ec2SecurityGroupOptlOpensearch = new aws.ec2.SecurityGroup(
  `${PROJECT_NAME}-optl-op-${STACK}`,
  {
    name: `${PROJECT_NAME}-optl-op-${STACK}`,
    vpcId: ec2Vpc.vpcId,
    ingress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        securityGroups: [
          ec2SecurityGroupOptlCollector.id,
          ec2SecurityGroupOptlUi.id,
        ],
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
