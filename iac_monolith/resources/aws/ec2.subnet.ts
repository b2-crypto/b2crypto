import * as aws from '@pulumi/aws';
import { PROJECT_NAME, STACK } from '../../secrets';
import { ec2Vpc } from './ec2.vpc';

export const ec2PublicSubnets = aws.ec2.getSubnetsOutput({
  filters: [
    {
      name: 'vpc-id',
      values: [ec2Vpc.id],
    },
    {
      name: 'tag:Name',
      values: [
        `${PROJECT_NAME}-${STACK}-public-1`,
        `${PROJECT_NAME}-${STACK}-public-2`,
        `${PROJECT_NAME}-${STACK}-public-3`,
      ],
    },
  ],
});
