import { acmCertificate } from './resources/aws/acm.certificate';
import {
  appautoscalingPolicyOptlCollector,
  appautoscalingPolicyOptlUi,
} from './resources/aws/appautoscaling.policy';
import {
  appautoscalingTargetOptlCollector,
  appautoscalingTargetOptlUi,
} from './resources/aws/appautoscaling.target';
import {
  cloudwatchDashboardOptlCollector,
  cloudwatchDashboardOptlUi,
} from './resources/aws/cloudwatch.dashboard';
import {
  cloudwatchLogGroupOptlCollector,
  cloudwatchLogGroupOptlUi,
} from './resources/aws/cloudwatch.log-group';
import {
  ec2SecurityGroup,
  ec2SecurityGroupOptlCollector,
  ec2SecurityGroupOptlUi,
} from './resources/aws/ec2.security-group';
import { ec2Vpc } from './resources/aws/ec2.vpc';
import { ecrRepository } from './resources/aws/ecr.repository';
import { ecsCluster } from './resources/aws/ecs.cluster';
import {
  ecsFargateServiceOptlCollector,
  ecsFargateServiceOptlUi,
} from './resources/aws/ecs.fargate-service';
import {
  lbApplicationLoadBalancerOptlCollector,
  lbApplicationLoadBalancerOptlUi,
} from './resources/aws/lb.application-load-balancer';
import { mqBrokerRabbitMQ } from './resources/aws/mq.broker';
import { opensearchDomainOptl } from './resources/aws/opensearch.domain';
import {
  route53RecordOptlCollector,
  route53RecordOptlUi,
} from './resources/aws/route53.record';
import { route53Zone } from './resources/aws/route53.zone';
import { mongoAtlasCluster } from './resources/mongoatlas/mongodbatlas.cluster';
import { mongodbatlasServerlessInstance } from './resources/mongoatlas/mongodbatlas.serverless-instance';

// const acmCertificate = new aws.acm.Certificate(
//   `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
//   {
//     domainName: DOMAIN,
//     subjectAlternativeNames: [`*.${DOMAIN}`],
//     validationMethod: 'DNS',
//     tags: TAGS,
//   },
// );

export const acmCertificateData = {
  arn: acmCertificate.arn,
  domain: acmCertificate.domain,
};

export const route53ZoneData = {
  id: route53Zone.id,
  name: route53Zone.name,
};

// const route53RecordValidation = new aws.route53.Record(
//   `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}-validation`,
//   {
//     zoneId: route53Zone.zoneId,
//     name: acmCertificate.domainValidationOptions[0].resourceRecordName,
//     type: acmCertificate.domainValidationOptions[0].resourceRecordType,
//     records: [acmCertificate.domainValidationOptions[0].resourceRecordValue],
//     ttl: 300,
//   },
// );

// export const route53RecordValidationData = {
//   name: route53RecordValidation.name,
//   type: route53RecordValidation.type,
//   zoneId: route53RecordValidation.zoneId,
//   fqdn: route53RecordValidation.fqdn,
// };

// const certificateValidation = new aws.acm.CertificateValidation(
//   `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
//   {
//     certificateArn: acmCertificate.arn,
//     validationRecordFqdns: [route53RecordValidation.fqdn],
//   },
// );

// export const certificateValidationData = {
//   certificateArn: certificateValidation.certificateArn,
//   validationRecordFqdns: certificateValidation.validationRecordFqdns,
// };

export const mongodbatlasServerlessInstanceData =
  mongodbatlasServerlessInstance;

export const mongoAtlasClusterData = mongoAtlasCluster;

export const ecrRepositoryData = {
  id: ecrRepository.id,
  repositoryUrl: ecrRepository.repositoryUrl.apply((value) =>
    value.split('@').at(0),
  ),
};

export const ec2VpcData = {
  vpcId: ec2Vpc.vpcId,
  publicSubnetIds: ec2Vpc.publicSubnetIds,
  privateSubnetIds: ec2Vpc.privateSubnetIds,
};

export const ec2SecurityGroupData = {
  id: ec2SecurityGroup.id,
  name: ec2SecurityGroup.name,
  egress: ec2SecurityGroup.egress,
  ingress: ec2SecurityGroup.ingress,
};

export const ec2SecurityGroupOptlCollectorData = {
  id: ec2SecurityGroupOptlCollector.id,
  name: ec2SecurityGroupOptlCollector.name,
  egress: ec2SecurityGroupOptlCollector.egress,
  ingress: ec2SecurityGroupOptlCollector.ingress,
};

export const ec2SecurityGroupOptlUiData = {
  id: ec2SecurityGroupOptlUi.id,
  name: ec2SecurityGroupOptlUi.name,
  egress: ec2SecurityGroupOptlUi.egress,
  ingress: ec2SecurityGroupOptlUi.ingress,
};

export const mqBrokerRabbitMQData = {
  id: mqBrokerRabbitMQ.id,
  brokerName: mqBrokerRabbitMQ.brokerName,
  instances: mqBrokerRabbitMQ.instances,
};

export const opensearchDomainOptlData = {
  id: opensearchDomainOptl.id,
  domainName: opensearchDomainOptl.domainName,
  endpoint: opensearchDomainOptl.endpoint,
};

export const ecsClusterData = {
  id: ecsCluster.id,
  name: ecsCluster.name,
};

export const lbApplicationLoadBalancerOptlCollectorData = {
  vpcId: lbApplicationLoadBalancerOptlCollector.vpcId,
  defaultSecurityGroup:
    lbApplicationLoadBalancerOptlCollector.defaultSecurityGroup,
  defaultTargetGroup: lbApplicationLoadBalancerOptlCollector.defaultTargetGroup,
  loadBalancer: lbApplicationLoadBalancerOptlCollector.loadBalancer,
  listeners: lbApplicationLoadBalancerOptlCollector.listeners,
};

export const lbApplicationLoadBalancerOptlUiData = {
  vpcId: lbApplicationLoadBalancerOptlUi.vpcId,
  defaultSecurityGroup: lbApplicationLoadBalancerOptlUi.defaultSecurityGroup,
  defaultTargetGroup: lbApplicationLoadBalancerOptlUi.defaultTargetGroup,
  loadBalancer: lbApplicationLoadBalancerOptlUi.loadBalancer,
  listeners: lbApplicationLoadBalancerOptlUi.listeners,
};

export const route53RecordOptlCollectorData = {
  name: route53RecordOptlCollector.name,
  type: route53RecordOptlCollector.type,
  zoneId: route53RecordOptlCollector.zoneId,
};

export const route53RecordOptlUiData = {
  name: route53RecordOptlUi.name,
  type: route53RecordOptlUi.type,
  zoneId: route53RecordOptlUi.zoneId,
};

export const cloudwatchLogGroupOptlCollectorData = {
  id: cloudwatchLogGroupOptlCollector.id,
  name: cloudwatchLogGroupOptlCollector.name,
};

export const cloudwatchLogGroupOptlUiData = {
  id: cloudwatchLogGroupOptlUi.id,
  name: cloudwatchLogGroupOptlUi.name,
};

export const cloudwatchDashboardOptlCollectorData = {
  dashboardName: cloudwatchDashboardOptlCollector.dashboardName,
};

export const cloudwatchDashboardOptlUiData = {
  dashboardName: cloudwatchDashboardOptlUi.dashboardName,
};

export const ecsFargateServiceOptlCollectorData = {
  serviceName: ecsFargateServiceOptlCollector.service.name,
};

export const ecsFargateServiceOptlUiData = {
  serviceName: ecsFargateServiceOptlUi.service.name,
};

export const appautoscalingTargetOptlCollectorData = {
  resourceId: appautoscalingTargetOptlCollector.resourceId,
  scalableDimension: appautoscalingTargetOptlCollector.scalableDimension,
  serviceNamespace: appautoscalingTargetOptlCollector.serviceNamespace,
};

export const appautoscalingTargetOptlUiData = {
  resourceId: appautoscalingTargetOptlUi.resourceId,
  scalableDimension: appautoscalingTargetOptlUi.scalableDimension,
  serviceNamespace: appautoscalingTargetOptlUi.serviceNamespace,
};

export const appautoscalingPolicyOptlCollectorData = {
  name: appautoscalingPolicyOptlCollector.name,
  policyType: appautoscalingPolicyOptlCollector.policyType,
  resourceId: appautoscalingPolicyOptlCollector.resourceId,
  scalableDimension: appautoscalingPolicyOptlCollector.scalableDimension,
  serviceNamespace: appautoscalingPolicyOptlCollector.serviceNamespace,
  targetTrackingScalingPolicyConfiguration:
    appautoscalingPolicyOptlCollector.targetTrackingScalingPolicyConfiguration,
};

export const appautoscalingPolicyOptlUiData = {
  name: appautoscalingPolicyOptlUi.name,
  policyType: appautoscalingPolicyOptlUi.policyType,
  resourceId: appautoscalingPolicyOptlUi.resourceId,
  scalableDimension: appautoscalingPolicyOptlUi.scalableDimension,
  serviceNamespace: appautoscalingPolicyOptlUi.serviceNamespace,
  targetTrackingScalingPolicyConfiguration:
    appautoscalingPolicyOptlUi.targetTrackingScalingPolicyConfiguration,
};
