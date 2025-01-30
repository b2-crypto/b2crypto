import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';
import {
  API_KEY_EMAIL_APP,
  APP_NAME,
  APP_VERSION,
  AUTH_EXPIRE_IN,
  AUTH_MAX_SECONDS_TO_REFRESH,
  AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE,
  AWS_SES_PORT,
  CACHE_MAX_ITEMS,
  CACHE_TTL,
  DATABASE_NAME,
  DEFAULT_CURRENCY_CONVERSION_COIN,
  DESIRED_COUNT_TASK,
  ENVIRONMENT,
  GOOGLE_2FA,
  isStressTest,
  LOGO_URL,
  mongoAtlasClusterName,
  POMELO_WHITELISTED_IPS_CHECK,
  PORT,
  PROJECT_NAME,
  RABBIT_MQ_PORT,
  RABBIT_MQ_QUEUE,
  REDIS_PORT,
  SECRETS,
  SOCIAL_MEDIA_ICONS,
  SOCIAL_MEDIA_LINKS,
  STACK,
  TAGS,
  TASK_CPU_MONOLITH,
  TASK_MEMORY_MONOLITH,
  TESTING,
  TZ,
  URL_API_EMAIL_APP,
} from '../../secrets';
import { mongoAtlasClusterExisting } from '../mongoatlas/mongodbatlas.cluster';
import { mongodbatlasServerlessInstance } from '../mongoatlas/mongodbatlas.serverless-instance';
import {
  cloudwatchLogGroup,
  cloudwatchLogGroupOptlCollector,
  cloudwatchLogGroupOptlUi,
} from './cloudwatch.log-group';
import {
  ec2SecurityGroup,
  ec2SecurityGroupOptlCollector,
  ec2SecurityGroupOptlUi,
} from './ec2.security-group';
import { ec2Vpc } from './ec2.vpc';
import { ecrImage, TAG } from './ecr.image';
import { ecsCluster } from './ecs.cluster';
import {
  lbApplicationLoadBalancer,
  lbApplicationLoadBalancerOptlCollector,
  lbApplicationLoadBalancerOptlUi,
} from './lb.application-load-balancer';
import { mqBrokerRabbitMQ } from './mq.broker';
import { opensearchDomainOptl } from './opensearch.domain';

export const ecsFargateService = new awsx.ecs.FargateService(
  `${PROJECT_NAME}-monolith-${STACK}`,
  {
    name: `${PROJECT_NAME}-monolith-${STACK}`,
    // assignPublicIp: true,
    cluster: ecsCluster.arn,
    propagateTags: 'SERVICE',
    networkConfiguration: {
      subnets: ec2Vpc.publicSubnetIds,
      securityGroups: [ec2SecurityGroup.id],
      assignPublicIp: true,
    },
    taskDefinitionArgs: {
      family: `${PROJECT_NAME}-monolith-${STACK}`,
      cpu: TASK_CPU_MONOLITH,
      memory: TASK_MEMORY_MONOLITH,
      container: {
        name: `${PROJECT_NAME}-monolith-${STACK}`,
        image: ecrImage.imageUri.apply(
          (imageUri) => `${imageUri.split('@').at(0)}:${TAG}`,
        ),
        cpu: parseInt(TASK_CPU_MONOLITH),
        memory: parseInt(TASK_MEMORY_MONOLITH),
        essential: true,
        environment: [
          { name: 'ENVIRONMENT', value: ENVIRONMENT },
          { name: 'APP_NAME', value: APP_NAME },
          { name: 'APP_VERSION', value: APP_VERSION },
          { name: 'STACK', value: STACK },
          { name: 'GOOGLE_2FA', value: GOOGLE_2FA },
          { name: 'PORT', value: PORT },
          { name: 'DATABASE_NAME', value: DATABASE_NAME },
          {
            name: 'DATABASE_URL',
            value: pulumi
              .all([
                mongoAtlasClusterExisting?.connectionStrings.apply(
                  (connections) => connections[0].standardSrv,
                ) ??
                  // mongoAtlasCluster?.connectionStrings.apply(
                  //   (connections) => connections[0].standardSrv,
                  // ) ??
                  mongodbatlasServerlessInstance?.connectionStringsStandardSrv,
                SECRETS.MONGOATLAS_USERNAME,
                SECRETS.MONGOATLAS_PASSWORD,
              ])
              .apply(([standardSrv, username, password]) => {
                const [protocol, domain] = standardSrv?.split('//') ?? [];

                return `${protocol}//${username}:${password}@${domain}/?retryWrites=true&w=majority&appName=${mongoAtlasClusterName}`;
              }),
          },
          {
            name: 'RABBIT_MQ_HOST',
            value: mqBrokerRabbitMQ?.instances?.apply(
              (instances) =>
                instances[0].endpoints[0]
                  ?.split('//')
                  .pop()
                  ?.split(':')
                  .shift() as string,
            ),
          },
          { name: 'RABBIT_MQ_PORT', value: RABBIT_MQ_PORT },
          { name: 'RABBIT_MQ_QUEUE', value: RABBIT_MQ_QUEUE },
          {
            name: 'RABBIT_MQ_USERNAME',
            value: SECRETS.RABBIT_MQ_USERNAME,
          },
          {
            name: 'RABBIT_MQ_PASSWORD',
            value: SECRETS.RABBIT_MQ_PASSWORD,
          },
          {
            name: 'REDIS_HOST',
            value: SECRETS.REDIS_HOST,
          },
          {
            name: 'REDIS_USERNAME',
            value: SECRETS.REDIS_USERNAME,
          },
          {
            name: 'REDIS_PASSWORD',
            value: SECRETS.REDIS_PASSWORD,
          },
          { name: 'REDIS_PORT', value: REDIS_PORT },
          { name: 'CACHE_TTL', value: CACHE_TTL },
          { name: 'CACHE_MAX_ITEMS', value: CACHE_MAX_ITEMS },
          {
            name: 'AUTH_MAX_SECONDS_TO_REFRESH',
            value: AUTH_MAX_SECONDS_TO_REFRESH,
          },
          {
            name: 'AUTH_SECRET',
            value: SECRETS.AUTH_SECRET,
          },
          { name: 'AUTH_EXPIRE_IN', value: AUTH_EXPIRE_IN },
          {
            name: 'API_KEY_EMAIL_APP',
            value: API_KEY_EMAIL_APP,
          },
          {
            name: 'URL_API_EMAIL_APP',
            value: URL_API_EMAIL_APP,
          },
          { name: 'TESTING', value: TESTING },
          { name: 'TZ', value: TZ },
          {
            name: 'AWS_SES_FROM_DEFAULT',
            value: SECRETS.AWS_SES_FROM_DEFAULT,
          },
          {
            name: 'AWS_SES_HOST',
            value: SECRETS.AWS_SES_HOST,
          },
          { name: 'AWS_SES_PORT', value: AWS_SES_PORT },
          {
            name: 'AWS_SES_USERNAME',
            value: SECRETS.AWS_SES_USERNAME,
          },
          {
            name: 'AWS_SES_PASSWORD',
            value: SECRETS.AWS_SES_PASSWORD,
          },
          {
            name: 'DEFAULT_CURRENCY_CONVERSION_COIN',
            value: DEFAULT_CURRENCY_CONVERSION_COIN,
          },
          {
            name: 'AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE',
            value: AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE,
          },
          {
            name: 'POMELO_SIGNATURE_SECRET_KEY_DIC',
            value: SECRETS.POMELO_SIGNATURE_SECRET_KEY_DIC,
          },
          {
            name: 'POMELO_WHITELISTED_IPS_CHECK',
            value: POMELO_WHITELISTED_IPS_CHECK,
          },
          {
            name: 'POMELO_WHITELISTED_IPS',
            value: SECRETS.POMELO_WHITELISTED_IPS,
          },
          {
            name: 'POMELO_CLIENT_ID',
            value: SECRETS.POMELO_CLIENT_ID,
          },
          {
            name: 'POMELO_SECRET_ID',
            value: SECRETS.POMELO_SECRET_ID,
          },
          {
            name: 'POMELO_AUDIENCE',
            value: SECRETS.POMELO_AUDIENCE,
          },
          {
            name: 'POMELO_AUTH_GRANT_TYPE',
            value: SECRETS.POMELO_AUTH_GRANT_TYPE,
          },
          {
            name: 'POMELO_API_URL',
            value: SECRETS.POMELO_API_URL,
          },
          {
            name: 'CURRENCY_CONVERSION_API_KEY',
            value: SECRETS.CURRENCY_CONVERSION_API_KEY,
          },
          {
            name: 'CURRENCY_CONVERSION_API_URL',
            value: SECRETS.CURRENCY_CONVERSION_API_URL,
          },
          {
            name: 'POMELO_SFTP_HOST',
            value: SECRETS.POMELO_SFTP_HOST,
          },
          {
            name: 'POMELO_SFTP_PORT',
            value: SECRETS.POMELO_SFTP_PORT,
          },
          {
            name: 'POMELO_SFTP_USR',
            value: SECRETS.POMELO_SFTP_USR,
          },
          {
            name: 'POMELO_SFTP_PASSPHRASE',
            value: SECRETS.POMELO_SFTP_PASSPHRASE,
          },
          {
            name: 'LOGO_URL',
            value: LOGO_URL,
          },
          {
            name: 'SOCIAL_MEDIA_ICONS',
            value: SOCIAL_MEDIA_ICONS,
          },
          {
            name: 'SOCIAL_MEDIA_LINKS',
            value: SOCIAL_MEDIA_LINKS,
          },
          { name: 'OTLP_API_KEY', value: SECRETS.OTLP_API_KEY },
          {
            name: 'OTLP_HOST_TRACES',
            value: SECRETS.OTLP_HOST.apply((host) => `${host}/v1/traces`),
          },
          {
            name: 'OTLP_HOST_LOGS',
            value: SECRETS.OTLP_HOST.apply((host) => `${host}/v1/logs`),
          },
          {
            name: 'OTLP_HOST_METRICS',
            value: SECRETS.OTLP_HOST.apply((host) => `${host}/v1/metrics`),
          },
          {
            name: 'OPTL_SERVICE_NAME',
            value: SECRETS.OPTL_SERVICE_NAME,
          },
          {
            name: 'V1_DB_USER',
            value: SECRETS.V1_DB_USER,
          },
          {
            name: 'V1_DB_PWD',
            value: SECRETS.V1_DB_PWD,
          },
          {
            name: 'V1_DB_HOST',
            value: SECRETS.V1_DB_HOST,
          },
          {
            name: 'V1_DB_PORT',
            value: SECRETS.V1_DB_PORT,
          },
          {
            name: 'V1_DB_NAME',
            value: SECRETS.V1_DB_NAME,
          },
        ],
        portMappings: [
          {
            name: `${PROJECT_NAME}-monolith-${STACK}`,
            containerPort: parseInt(PORT),
            hostPort: parseInt(PORT),
            protocol: 'tcp',
            targetGroup: lbApplicationLoadBalancer.defaultTargetGroup,
          },
        ],
        readonlyRootFilesystem: false,
        healthCheck: {
          command: ['CMD-SHELL', `curl -f http://localhost/health || exit 1`],
          startPeriod: 15,
          interval: 5,
          timeout: 3,
          retries: 3,
        },
        logConfiguration: {
          logDriver: 'awslogs',
          options: {
            'awslogs-group': cloudwatchLogGroup.name,
            'awslogs-region': aws.config.region,
            'awslogs-stream-prefix': 'ecs-task',
          },
        },
      },
    },
    desiredCount: isStressTest() ? 3 : DESIRED_COUNT_TASK,
    deploymentMinimumHealthyPercent: 100,
    deploymentMaximumPercent: 200,
    enableEcsManagedTags: true,
    tags: TAGS,
  },
);

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
            value: opensearchDomainOptl.endpoint.apply(
              (value) => `https://${value}`,
            ),
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
    desiredCount: DESIRED_COUNT_TASK,
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
            value: opensearchDomainOptl.endpoint.apply(
              (value) => `https://${value}`,
            ),
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
    desiredCount: DESIRED_COUNT_TASK,
    deploymentMinimumHealthyPercent: 100,
    deploymentMaximumPercent: 200,
    enableEcsManagedTags: true,
    tags: TAGS,
  },
);
