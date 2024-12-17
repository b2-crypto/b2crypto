import * as aws from '@pulumi/aws';
import {
  PROJECT_NAME,
  STACK,
  SUBDOMAIN_PREFIX,
  SUBDOMAIN_PREFIX_OPTL_COLLECTOR,
  SUBDOMAIN_PREFIX_OPTL_UI,
} from '../../secrets';
import {
  lbApplicationLoadBalancer,
  lbApplicationLoadBalancerOptlCollector,
  lbApplicationLoadBalancerOptlUi,
} from './lb.application-load-balancer';
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

export const route53RecordOptlCollector = new aws.route53.Record(
  `${PROJECT_NAME}-optl-collector-${STACK}`,
  {
    zoneId: route53Zone.id,
    name: SUBDOMAIN_PREFIX_OPTL_COLLECTOR,
    type: 'A',
    aliases: [
      {
        name: lbApplicationLoadBalancerOptlCollector.loadBalancer.dnsName,
        zoneId: lbApplicationLoadBalancerOptlCollector.loadBalancer.zoneId,
        evaluateTargetHealth: true,
      },
    ],
  },
);

export const route53RecordOptlUi = new aws.route53.Record(
  `${PROJECT_NAME}-optl-ui-${STACK}`,
  {
    zoneId: route53Zone.id,
    name: SUBDOMAIN_PREFIX_OPTL_UI,
    type: 'A',
    aliases: [
      {
        name: lbApplicationLoadBalancerOptlUi.loadBalancer.dnsName,
        zoneId: lbApplicationLoadBalancerOptlUi.loadBalancer.zoneId,
        evaluateTargetHealth: true,
      },
    ],
  },
);
