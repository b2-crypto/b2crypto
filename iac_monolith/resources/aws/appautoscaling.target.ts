import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import {
  isStressTest,
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
    maxCapacity: isStressTest() ? 10 : MAX_CAPACITY_AUTOSCALING,
    minCapacity: isStressTest() ? 3 : MIN_CAPACITY_AUTOSCALING,
    resourceId: pulumi.interpolate`service/${ecsCluster.clusterName}/${ecsFargateService.service.name}`,
    scalableDimension: 'ecs:service:DesiredCount',
    serviceNamespace: 'ecs',
  },
);
