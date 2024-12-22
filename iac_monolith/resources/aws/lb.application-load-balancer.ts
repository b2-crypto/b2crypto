import * as awsx from '@pulumi/awsx';
import { PORT, PROJECT_NAME, STACK, TAGS } from '../../secrets';
import { acmCertificate } from './acm.certificate';
import { ec2SecurityGroup } from './ec2.security-group';
import { ec2PublicSubnets } from './ec2.subnet';
import { ec2Vpc } from './ec2.vpc';

export const lbApplicationLoadBalancer = new awsx.lb.ApplicationLoadBalancer(
  `${PROJECT_NAME}-monolith-${STACK}`,
  {
    name: `${PROJECT_NAME}-monolith-${STACK}`,
    enableHttp2: true,
    defaultTargetGroup: {
      name: `${PROJECT_NAME}-monolith-${STACK}`,
      protocol: 'HTTP',
      port: parseInt(PORT),
      vpcId: ec2Vpc.id,
      tags: TAGS,
      healthCheck: {
        path: '/health',
        interval: 5,
        timeout: 3,
      },
    },
    securityGroups: [ec2SecurityGroup.id],
    subnetIds: ec2PublicSubnets.ids,
    listeners: [
      {
        port: 443,
        protocol: 'HTTPS',
        certificateArn: acmCertificate.arn,
        tags: TAGS,
      },
    ],
    preserveHostHeader: true,
    tags: TAGS,
  },
);
