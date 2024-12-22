import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';
import {
  API_KEY_EMAIL_APP,
  APP_NAME,
  AUTH_EXPIRE_IN,
  AUTH_MAX_SECONDS_TO_REFRESH,
  AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE,
  AWS_SES_PORT,
  CACHE_MAX_ITEMS,
  CACHE_TTL,
  DATABASE_NAME,
  DEFAULT_CURRENCY_CONVERSION_COIN,
  DESIRED_COUNT_TASK,
  DOMAIN,
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
  SUBDOMAIN_PREFIX_OPTL_COLLECTOR,
  TAGS,
  TZ,
  URL_API_EMAIL_APP,
} from '../../secrets';
import { mongoAtlasCluster } from '../mongoatlas/mongodbatlas.cluster';
import { mongodbatlasServerlessInstance } from '../mongoatlas/mongodbatlas.serverless-instance';
import { cloudwatchLogGroup } from './cloudwatch.log-group';
import { ec2SecurityGroup } from './ec2.security-group';
import { ec2PublicSubnets } from './ec2.subnet';
import { ecrImage, TAG } from './ecr.image';
import { ecsCluster } from './ecs.cluster';
import { lbApplicationLoadBalancer } from './lb.application-load-balancer';
import { mqBrokerRabbitMQ } from './mq.broker';

export const ecsFargateService = new awsx.ecs.FargateService(
  `${PROJECT_NAME}-monolith-${STACK}`,
  {
    name: `${PROJECT_NAME}-monolith-${STACK}`,
    // assignPublicIp: true,
    cluster: ecsCluster.arn,
    propagateTags: 'SERVICE',
    networkConfiguration: {
      subnets: ec2PublicSubnets.ids,
      securityGroups: [ec2SecurityGroup.id],
      assignPublicIp: true,
    },
    taskDefinitionArgs: {
      family: `${PROJECT_NAME}-monolith-${STACK}`,
      cpu: '1024',
      memory: '2048',
      container: {
        name: `${PROJECT_NAME}-monolith-${STACK}`,
        image: ecrImage.imageUri.apply(
          (imageUri) => `${imageUri.split('@').at(0)}:${TAG}`,
        ),
        cpu: 1024,
        memory: 2048,
        essential: true,
        environment: [
          { name: 'ENVIRONMENT', value: ENVIRONMENT },
          { name: 'APP_NAME', value: APP_NAME },
          { name: 'GOOGLE_2FA', value: GOOGLE_2FA },
          { name: 'PORT', value: PORT },
          { name: 'DATABASE_NAME', value: DATABASE_NAME },
          {
            name: 'DATABASE_URL',
            value: pulumi
              .all([
                mongodbatlasServerlessInstance?.connectionStringsStandardSrv.apply(
                  (connection) => connection.split('//').pop(),
                ) ??
                  mongoAtlasCluster?.connectionStrings.apply((connections) =>
                    connections[0].standardSrv.split('//').pop(),
                  ),
                SECRETS.MONGOATLAS_USERNAME,
                SECRETS.MONGOATLAS_PASSWORD,
              ])
              .apply(([connection, username, password]) => {
                return `mongodb+srv://${username}:${password}@${connection}/?retryWrites=true&w=majority&appName=${mongoAtlasClusterName}`;
              }),
          },
          {
            name: 'RABBIT_MQ_HOST',
            value: mqBrokerRabbitMQ.instances[0].endpoints[0].apply(
              (endpoint) => endpoint.split('//').pop() as string,
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
          {
            name: 'OPTL_API_URL',
            value: `https://${SUBDOMAIN_PREFIX_OPTL_COLLECTOR}.${DOMAIN}/v1/traces`,
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
