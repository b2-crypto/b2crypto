import * as aws from '@pulumi/aws';
import { ec2Vpc } from './ec2.vpc';

export const ec2PublicSubnets = aws.ec2.getSubnetsOutput({
  filters: [
    {
      name: 'vpc-id',
      values: [ec2Vpc.id],
    },
    {
      name: 'subnet-type',
      values: ['public'],
    },
  ],
});
