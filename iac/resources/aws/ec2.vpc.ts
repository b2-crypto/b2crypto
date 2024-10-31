import * as awsx from '@pulumi/awsx';
import { PROJECT_NAME, STACK, TAGS, VPC_CIDR_BLOCK } from '../../secrets';

export const ec2Vpc = new awsx.ec2.Vpc(`${PROJECT_NAME}-${STACK}`, {
  enableNetworkAddressUsageMetrics: true,
  numberOfAvailabilityZones: 3,
  cidrBlock: VPC_CIDR_BLOCK,
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: TAGS,
});
