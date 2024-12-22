import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import {
  DESIRED_COUNT_TASK_OPTL_COLLECTOR,
  DESIRED_COUNT_TASK_OPTL_UI,
  DOMAIN,
  PROJECT_NAME,
  SECRETS,
  STACK,
  SUBDOMAIN_PREFIX_OPENSEARCH,
  TAGS,
} from '../../secrets';
import {
  cloudwatchLogGroupOptlCollector,
  cloudwatchLogGroupOptlUi,
} from './cloudwatch.log-group';
import {
  ec2SecurityGroupOptlCollector,
  ec2SecurityGroupOptlUi,
} from './ec2.security-group';
import { ec2Vpc } from './ec2.vpc';
import { ecsCluster } from './ecs.cluster';
import {
  lbApplicationLoadBalancerOptlCollector,
  lbApplicationLoadBalancerOptlUi,
} from './lb.application-load-balancer';

export const ecsFargateServiceOptlCollector = new awsx.ecs.FargateService(
  `${PROJECT_NAME}-optl-collector-${STACK}`,
  {
    name: `${PROJECT_NAME}-optl-collector-${STACK}`,
    // assignPublicIp: true,
    cluster: ecsCluster.arn,
    propagateTags: 'SERVICE',
    networkConfiguration: {
      subnets: ec2Vpc.publicSubnetIds,
      securityGroups: [ec2SecurityGroupOptlCollector.id],
      assignPublicIp: true,
    },
    taskDefinitionArgs: {
      family: `${PROJECT_NAME}-optl-collector-${STACK}`,
      cpu: '1024',
      memory: '2048',
      container: {
        name: `optl-collector`,
        image: 'jaegertracing/jaeger-collector:1.62.0',
        cpu: 1024,
        memory: 2048,
        essential: true,
        environment: [
          { name: 'SPAN_STORAGE_TYPE', value: 'elasticsearch' },
          {
            name: 'ES_SERVER_URLS',
            value: `https://${SUBDOMAIN_PREFIX_OPENSEARCH}.${DOMAIN}`,
          },
          {
            name: 'ES_USERNAME',
            value: SECRETS.OPTL_OPEN_SEARCH_USERNAME,
          },
          {
            name: 'ES_PASSWORD',
            value: SECRETS.OPTL_OPEN_SEARCH_PASSWORD,
          },
        ],
        portMappings: [
          {
            name: `${PROJECT_NAME}-optl-collector-grpc-${STACK}`,
            containerPort: 4318,
            hostPort: 4318,
            protocol: 'tcp',
            targetGroup:
              lbApplicationLoadBalancerOptlCollector.defaultTargetGroup,
          },
          {
            name: `${PROJECT_NAME}-optl-collector-health-${STACK}`,
            containerPort: 14269,
            hostPort: 14269,
            protocol: 'tcp',
          },
        ],
        readonlyRootFilesystem: true,
        // healthCheck: {
        //   command: ['CMD-SHELL', `curl -f http://localhost:14269 || exit 1`],
        //   startPeriod: 15,
        //   interval: 10,
        //   timeout: 3,
        //   retries: 3,
        // },
        logConfiguration: {
          logDriver: 'awslogs',
          options: {
            'awslogs-group': cloudwatchLogGroupOptlCollector.name,
            'awslogs-region': aws.config.region,
            'awslogs-stream-prefix': 'ecs-task',
          },
        },
      },
    },
    desiredCount: DESIRED_COUNT_TASK_OPTL_COLLECTOR,
    deploymentMinimumHealthyPercent: 100,
    deploymentMaximumPercent: 200,
    enableEcsManagedTags: true,
    tags: TAGS,
  },
);

export const ecsFargateServiceOptlUi = new awsx.ecs.FargateService(
  `${PROJECT_NAME}-optl-ui-${STACK}`,
  {
    name: `${PROJECT_NAME}-optl-ui-${STACK}`,
    // assignPublicIp: true,
    cluster: ecsCluster.arn,
    propagateTags: 'SERVICE',
    networkConfiguration: {
      subnets: ec2Vpc.publicSubnetIds,
      securityGroups: [ec2SecurityGroupOptlUi.id],
      assignPublicIp: true,
    },
    taskDefinitionArgs: {
      family: `${PROJECT_NAME}-optl-ui-${STACK}`,
      cpu: '1024',
      memory: '2048',
      container: {
        name: `optl-ui`,
        image: 'jaegertracing/jaeger-query:1.62.0',
        cpu: 1024,
        memory: 2048,
        essential: true,
        environment: [
          { name: 'SPAN_STORAGE_TYPE', value: 'elasticsearch' },
          {
            name: 'ES_SERVER_URLS',
            value: `https://${SUBDOMAIN_PREFIX_OPENSEARCH}.${DOMAIN}`,
          },
          {
            name: 'ES_USERNAME',
            value: SECRETS.OPTL_OPEN_SEARCH_USERNAME,
          },
          {
            name: 'ES_PASSWORD',
            value: SECRETS.OPTL_OPEN_SEARCH_PASSWORD,
          },
        ],
        portMappings: [
          {
            name: `${PROJECT_NAME}-optl-ui-${STACK}`,
            containerPort: 16686,
            hostPort: 16686,
            protocol: 'tcp',
            targetGroup: lbApplicationLoadBalancerOptlUi.defaultTargetGroup,
          },
          {
            name: `${PROJECT_NAME}-optl-ui-health-${STACK}`,
            containerPort: 16687,
            hostPort: 16687,
            protocol: 'tcp',
          },
        ],
        readonlyRootFilesystem: true,
        // healthCheck: {
        //   command: ['CMD-SHELL', `curl -f http://localhost:16687 || exit 1`],
        //   startPeriod: 15,
        //   interval: 10,
        //   timeout: 3,
        //   retries: 3,
        // },
        logConfiguration: {
          logDriver: 'awslogs',
          options: {
            'awslogs-group': cloudwatchLogGroupOptlUi.name,
            'awslogs-region': aws.config.region,
            'awslogs-stream-prefix': 'ecs-task',
          },
        },
      },
    },
    desiredCount: DESIRED_COUNT_TASK_OPTL_UI,
    deploymentMinimumHealthyPercent: 100,
    deploymentMaximumPercent: 200,
    enableEcsManagedTags: true,
    tags: TAGS,
  },
);
