import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import {
  MAX_CAPACITY_AUTOSCALING,
  MIN_CAPACITY_AUTOSCALING,
  PROJECT_NAME,
  STACK,
} from '../../secrets';
import { ecsCluster } from './ecs.cluster';
import { ecsFargateService } from './ecs.fargate-service';

export const appautoscalingTarget = new aws.appautoscaling.Target(
  `${PROJECT_NAME}-monolith-${STACK}`,
  {
    maxCapacity: MAX_CAPACITY_AUTOSCALING,
    minCapacity: MIN_CAPACITY_AUTOSCALING,
    resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsFargateService.service.name}`,
    scalableDimension: 'ecs:service:DesiredCount',
    serviceNamespace: 'ecs',
  },
);

// export const appautoscalingTargetOptlCollector = new aws.appautoscaling.Target(
//   `${PROJECT_NAME}-optl-collector-${STACK}`,
//   {
//     maxCapacity: OPTL_COLLECTOR_MAX_CAPACITY_AUTOSCALING,
//     minCapacity: OPTL_COLLECTOR_MIN_CAPACITY_AUTOSCALING,
//     resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsFargateServiceOptlCollector.service.name}`,
//     scalableDimension: 'ecs:service:DesiredCount',
//     serviceNamespace: 'ecs',
//   },
// );

// export const appautoscalingTargetOptlUi = new aws.appautoscaling.Target(
//   `${PROJECT_NAME}-optl-ui-${STACK}`,
//   {
//     maxCapacity: OPTL_COLLECTOR_MAX_CAPACITY_AUTOSCALING,
//     minCapacity: OPTL_COLLECTOR_MIN_CAPACITY_AUTOSCALING,
//     resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsFargateServiceOptlUi.service.name}`,
//     scalableDimension: 'ecs:service:DesiredCount',
//     serviceNamespace: 'ecs',
//   },
// );
