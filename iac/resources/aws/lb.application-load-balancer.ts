import * as awsx from '@pulumi/awsx';
import { PORT, PROJECT_NAME, STACK, TAGS } from '../../secrets';
import { acmCertificate } from './acm.certificate';
import { ec2SecurityGroup } from './ec2.security-group';
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
      vpcId: ec2Vpc.vpcId,
      tags: TAGS,
      healthCheck: {
        path: '/health',
        interval: 5,
        timeout: 3,
      },
    },
    securityGroups: [ec2SecurityGroup.id],
    subnetIds: ec2Vpc.publicSubnetIds,
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

// export const lbApplicationLoadBalancerOptlCollector =
//   new awsx.lb.ApplicationLoadBalancer(
//     `${PROJECT_NAME}-optl-collector-${STACK}`,
//     {
//       name: `${PROJECT_NAME}-optl-collector-${STACK}`,
//       enableHttp2: true,
//       defaultTargetGroup: {
//         name: `${PROJECT_NAME}-optl-collector-${STACK}`,
//         protocol: 'HTTP',
//         port: 4318,
//         vpcId: ec2Vpc.vpcId,
//         tags: TAGS,
//         healthCheck: {
//           port: '14269',
//           path: '/',
//           interval: 5,
//           timeout: 3,
//         },
//       },
//       securityGroups: [ec2SecurityGroupOptlCollector.id],
//       subnetIds: ec2Vpc.publicSubnetIds,
//       listeners: [
//         {
//           port: 443,
//           protocol: 'HTTPS',
//           certificateArn: acmCertificate.arn,
//           tags: TAGS,
//         },
//       ],
//       preserveHostHeader: true,
//       tags: TAGS,
//     },
//   );

// export const lbApplicationLoadBalancerOptlUi =
//   new awsx.lb.ApplicationLoadBalancer(`${PROJECT_NAME}-optl-ui-${STACK}`, {
//     name: `${PROJECT_NAME}-optl-ui-${STACK}`,
//     enableHttp2: true,
//     defaultTargetGroup: {
//       name: `${PROJECT_NAME}-optl-ui-${STACK}`,
//       protocol: 'HTTP',
//       port: 16686,
//       vpcId: ec2Vpc.vpcId,
//       tags: TAGS,
//       healthCheck: {
//         port: '16687',
//         path: '/',
//         interval: 5,
//         timeout: 3,
//       },
//     },
//     securityGroups: [ec2SecurityGroupOptlUi.id],
//     subnetIds: ec2Vpc.publicSubnetIds,
//     listeners: [
//       {
//         port: 443,
//         protocol: 'HTTPS',
//         certificateArn: acmCertificate.arn,
//         tags: TAGS,
//       },
//     ],
//     preserveHostHeader: true,
//     tags: TAGS,
//   });
