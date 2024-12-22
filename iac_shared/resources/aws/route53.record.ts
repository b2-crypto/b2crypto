import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import {
  PROJECT_NAME,
  STACK,
  SUBDOMAIN_PREFIX_MONGODB,
  SUBDOMAIN_PREFIX_OPENSEARCH,
  SUBDOMAIN_PREFIX_OPTL_COLLECTOR,
  SUBDOMAIN_PREFIX_OPTL_UI,
  SUBDOMAIN_PREFIX_RABBITMQ,
} from '../../secrets';
import { mongoAtlasCluster } from '../mongoatlas/mongodbatlas.cluster';
import { mongodbatlasServerlessInstance } from '../mongoatlas/mongodbatlas.serverless-instance';
import {
  lbApplicationLoadBalancerOptlCollector,
  lbApplicationLoadBalancerOptlUi,
} from './lb.application-load-balancer';
import { mqBrokerRabbitMQ } from './mq.broker';
import { opensearchDomainOptl } from './opensearch.domain';
import { route53Zone } from './route53.zone';

export const route53RecordMongoDB = new aws.route53.Record(
  `${PROJECT_NAME}-mongodb-${STACK}`,
  {
    zoneId: route53Zone.id,
    name: SUBDOMAIN_PREFIX_MONGODB,
    type: 'CNAME',
    records: pulumi
      .all([
        mongoAtlasCluster?.connectionStrings.apply(
          (connections) => connections[0].standardSrv,
        ) ?? mongodbatlasServerlessInstance?.connectionStringsStandardSrv,
      ])
      .apply(([standardSrv]) => {
        const [, domain] = standardSrv?.split('//') ?? [];

        return [domain];
      }),
  },
);

export const route53RecordRabbitMQ = new aws.route53.Record(
  `${PROJECT_NAME}-rabbitmq-${STACK}`,
  {
    zoneId: route53Zone.id,
    name: SUBDOMAIN_PREFIX_RABBITMQ,
    type: 'CNAME',
    records: mqBrokerRabbitMQ.instances.apply((instances) =>
      instances[0].endpoints.map(
        (endpoint) => endpoint.split('//').pop() as string,
      ),
    ),
  },
);

export const route53RecordOpensearch = new aws.route53.Record(
  `${PROJECT_NAME}-opensearch-${STACK}`,
  {
    zoneId: route53Zone.id,
    name: SUBDOMAIN_PREFIX_OPENSEARCH,
    type: 'CNAME',
    records: opensearchDomainOptl.endpoint.apply((endpoint) => [endpoint]),
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
