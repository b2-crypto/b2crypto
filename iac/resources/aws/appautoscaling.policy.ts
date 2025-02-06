import * as aws from '@pulumi/aws';
import { PROJECT_NAME, STACK } from '../../secrets';
import { appautoscalingTarget } from './appautoscaling.target';

export const appautoscalingPolicy = new aws.appautoscaling.Policy(
  `${PROJECT_NAME}-monolith-${STACK}`,
  {
    policyType: 'TargetTrackingScaling',
    resourceId: appautoscalingTarget.resourceId,
    scalableDimension: appautoscalingTarget.scalableDimension,
    serviceNamespace: appautoscalingTarget.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: {
      predefinedMetricSpecification: {
        predefinedMetricType: 'ECSServiceAverageCPUUtilization',
      },
      targetValue: 50.0,
    },
  },
);

// export const appautoscalingPolicyOptlCollector = new aws.appautoscaling.Policy(
//   `${PROJECT_NAME}-optl-collector-${STACK}`,
//   {
//     policyType: 'TargetTrackingScaling',
//     resourceId: appautoscalingTargetOptlCollector.resourceId,
//     scalableDimension: appautoscalingTargetOptlCollector.scalableDimension,
//     serviceNamespace: appautoscalingTargetOptlCollector.serviceNamespace,
//     targetTrackingScalingPolicyConfiguration: {
//       predefinedMetricSpecification: {
//         predefinedMetricType: 'ECSServiceAverageCPUUtilization',
//       },
//       targetValue: 50.0,
//     },
//   },
// );

// export const appautoscalingPolicyOptlUi = new aws.appautoscaling.Policy(
//   `${PROJECT_NAME}-optl-ui-${STACK}`,
//   {
//     policyType: 'TargetTrackingScaling',
//     resourceId: appautoscalingTargetOptlUi.resourceId,
//     scalableDimension: appautoscalingTargetOptlUi.scalableDimension,
//     serviceNamespace: appautoscalingTargetOptlUi.serviceNamespace,
//     targetTrackingScalingPolicyConfiguration: {
//       predefinedMetricSpecification: {
//         predefinedMetricType: 'ECSServiceAverageCPUUtilization',
//       },
//       targetValue: 50.0,
//     },
//   },
// );
