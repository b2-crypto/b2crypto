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
