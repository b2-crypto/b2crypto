import { appautoscalingPolicy } from './resources/aws/appautoscaling.policy';
import { appautoscalingTarget } from './resources/aws/appautoscaling.target';
import { cloudwatchDashboard } from './resources/aws/cloudwatch.dashboard';
import { cloudwatchLogGroup } from './resources/aws/cloudwatch.log-group';
import { ecrImage, TAG } from './resources/aws/ecr.image';
import { ecsFargateService } from './resources/aws/ecs.fargate-service';
import { lbApplicationLoadBalancer } from './resources/aws/lb.application-load-balancer';
import { route53Record } from './resources/aws/route53.record';
3;

export const ecrImageData = {
  imageUri: ecrImage.imageUri.apply(
    (imageUri) => `${imageUri.split('@').at(0)}:${TAG}`,
  ),
};

export const lbApplicationLoadBalancerData = {
  vpcId: lbApplicationLoadBalancer.vpcId,
  defaultSecurityGroup: lbApplicationLoadBalancer.defaultSecurityGroup,
  defaultTargetGroup: lbApplicationLoadBalancer.defaultTargetGroup,
  loadBalancer: lbApplicationLoadBalancer.loadBalancer,
  listeners: lbApplicationLoadBalancer.listeners,
};

export const route53RecordData = {
  name: route53Record.name,
  type: route53Record.type,
  zoneId: route53Record.zoneId,
};

export const cloudwatchLogGroupData = {
  id: cloudwatchLogGroup.id,
  name: cloudwatchLogGroup.name,
};

export const cloudwatchDashboardData = {
  dashboardName: cloudwatchDashboard.dashboardName,
};

export const ecsFargateServiceData = {
  serviceName: ecsFargateService.service.name,
};

export const appautoscalingTargetData = {
  resourceId: appautoscalingTarget.resourceId,
  scalableDimension: appautoscalingTarget.scalableDimension,
  serviceNamespace: appautoscalingTarget.serviceNamespace,
};

export const appautoscalingPolicyData = {
  name: appautoscalingPolicy.name,
  policyType: appautoscalingPolicy.policyType,
  resourceId: appautoscalingPolicy.resourceId,
  scalableDimension: appautoscalingPolicy.scalableDimension,
  serviceNamespace: appautoscalingPolicy.serviceNamespace,
  targetTrackingScalingPolicyConfiguration:
    appautoscalingPolicy.targetTrackingScalingPolicyConfiguration,
};
