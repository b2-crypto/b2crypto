import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { COMPANY_NAME, PROJECT_NAME, STACK } from '../../secrets';
import { ecsCluster } from './ecs.cluster';
import { ecsFargateService } from './ecs.fargate-service';

export const cloudwatchDashboard = new aws.cloudwatch.Dashboard(
  `${PROJECT_NAME}-monolith-${STACK}`,
  {
    dashboardName: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
    dashboardBody: pulumi
      .all([ecsCluster.clusterName, ecsFargateService.service.name])
      .apply(([clusterName, serviceName]) =>
        JSON.stringify({
          widgets: [
            {
              type: 'metric',
              x: 0,
              y: 0,
              width: 24,
              height: 6,
              properties: {
                metrics: [
                  [
                    'AWS/ECS',
                    'CPUUtilization',
                    'ServiceName',
                    serviceName,
                    'ClusterName',
                    clusterName,
                  ],
                  [
                    'AWS/ECS',
                    'MemoryUtilization',
                    'ServiceName',
                    serviceName,
                    'ClusterName',
                    clusterName,
                  ],
                ],
                period: 60,
                stat: 'Average',
                view: 'timeSeries',
                stacked: false,
                region: aws.config.region,
                title: 'ECS Task CPU and Memory Utilization',
              },
            },
          ],
        }),
      ),
  },
);
