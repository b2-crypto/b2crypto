import * as aws from '@pulumi/aws';
import { TAGS, VPC_CIDR_BLOCK } from '../../secrets';

export const ec2Vpc = aws.ec2.getVpcOutput({
  cidrBlock: VPC_CIDR_BLOCK,
  tags: TAGS,
});
