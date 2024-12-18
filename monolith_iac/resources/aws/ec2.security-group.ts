import * as aws from '@pulumi/aws';
import { PROJECT_NAME, STACK } from '../../secrets';

export const ec2SecurityGroup = aws.ec2.getSecurityGroupOutput({
  name: `${PROJECT_NAME}-monolith-${STACK}`,
});
