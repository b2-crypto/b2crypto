import * as aws from '@pulumi/aws';
import { PROJECT_NAME, STACK, SUBDOMAIN_PREFIX } from '../../secrets';
import { lbApplicationLoadBalancer } from './lb.application-load-balancer';
import { route53Zone } from './route53.zone';

export const route53Record = new aws.route53.Record(
  `${PROJECT_NAME}-monolith-${STACK}`,
  {
    zoneId: route53Zone.id,
    name: SUBDOMAIN_PREFIX,
    type: 'A',
    aliases: [
      {
        name: lbApplicationLoadBalancer.loadBalancer.dnsName,
        zoneId: lbApplicationLoadBalancer.loadBalancer.zoneId,
        evaluateTargetHealth: true,
      },
    ],
  },
);
