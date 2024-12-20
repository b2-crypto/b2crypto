import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import {
  MAX_CAPACITY_AUTOSCALING_OPTL_COLLECTOR,
  MAX_CAPACITY_AUTOSCALING_OPTL_UI,
  MIN_CAPACITY_AUTOSCALING_OPTL_COLLECTOR,
  MIN_CAPACITY_AUTOSCALING_OPTL_UI,
  PROJECT_NAME,
  STACK,
} from '../../secrets';
import { ecsCluster } from './ecs.cluster';
import {
  ecsFargateServiceOptlCollector,
  ecsFargateServiceOptlUi,
} from './ecs.fargate-service';

export const appautoscalingTargetOptlCollector = new aws.appautoscaling.Target(
  `${PROJECT_NAME}-optl-collector-${STACK}`,
  {
    maxCapacity: MAX_CAPACITY_AUTOSCALING_OPTL_COLLECTOR,
    minCapacity: MIN_CAPACITY_AUTOSCALING_OPTL_COLLECTOR,
    resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsFargateServiceOptlCollector.service.name}`,
    scalableDimension: 'ecs:service:DesiredCount',
    serviceNamespace: 'ecs',
  },
);

export const appautoscalingTargetOptlUi = new aws.appautoscaling.Target(
  `${PROJECT_NAME}-optl-ui-${STACK}`,
  {
    maxCapacity: MAX_CAPACITY_AUTOSCALING_OPTL_UI,
    minCapacity: MIN_CAPACITY_AUTOSCALING_OPTL_UI,
    resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsFargateServiceOptlUi.service.name}`,
    scalableDimension: 'ecs:service:DesiredCount',
    serviceNamespace: 'ecs',
  },
);
