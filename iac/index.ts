import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const COMPANY_NAME = 'b2crypto';
const PROJECT_NAME = 'monolith';
const STACK = config.require('STACK');
const CREATED_BY = 'Pulumi IaC';
const ENVIRONMENT = config.require('ENVIRONMENT');
const APP_NAME = config.require('APP_NAME');
const GOOGLE_2FA = config.require('GOOGLE_2FA');
const PORT = config.require('PORT');
const DATABASE_NAME = config.require('DATABASE_NAME');
const DATABASE_URL = config.require('DATABASE_URL');
const RABBIT_MQ_HOST = config.require('RABBIT_MQ_HOST');
const RABBIT_MQ_PORT = config.require('RABBIT_MQ_PORT');
const RABBIT_MQ_QUEUE = config.require('RABBIT_MQ_QUEUE');
const RABBIT_MQ_USERNAME = config.require('RABBIT_MQ_USERNAME');
const RABBIT_MQ_PASSWORD = config.require('RABBIT_MQ_PASSWORD');
const REDIS_HOST = config.require('REDIS_HOST');
const REDIS_USERNAME = config.require('REDIS_USERNAME');
const REDIS_PASSWORD = config.require('REDIS_PASSWORD');
const REDIS_PORT = config.require('REDIS_PORT');
const CACHE_TTL = config.require('CACHE_TTL');
const CACHE_MAX_ITEMS = config.require('CACHE_MAX_ITEMS');
const AUTH_MAX_SECONDS_TO_REFRESH = config.require(
  'AUTH_MAX_SECONDS_TO_REFRESH',
);
const OTP_VALIDATION_TIME_SECONDS = config.require(
  'OTP_VALIDATION_TIME_SECONDS',
);
const AUTH_SECRET = config.require('AUTH_SECRET');
const AUTH_EXPIRE_IN = config.require('AUTH_EXPIRE_IN');
const API_KEY_EMAIL_APP = config.require('API_KEY_EMAIL_APP');
const URL_API_EMAIL_APP = config.require('URL_API_EMAIL_APP');
const TESTING = config.require('TESTING');
const TZ = config.require('TZ');
const AWS_SES_FROM_DEFAULT = config.require('AWS_SES_FROM_DEFAULT');
const AWS_SES_HOST = config.require('AWS_SES_HOST');
const AWS_SES_PORT = config.require('AWS_SES_PORT');
const AWS_SES_USERNAME = config.require('AWS_SES_USERNAME');
const AWS_SES_PASSWORD = config.require('AWS_SES_PASSWORD');
const DEFAULT_CURRENCY_CONVERSION_COIN = config.require(
  'DEFAULT_CURRENCY_CONVERSION_COIN',
);
const AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE = config.require(
  'AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE',
);
const POMELO_SIGNATURE_SECRET_KEY_DIC = config.require(
  'POMELO_SIGNATURE_SECRET_KEY_DIC',
);
const POMELO_WHITELISTED_IPS_CHECK = config.require(
  'POMELO_WHITELISTED_IPS_CHECK',
);
const POMELO_WHITELISTED_IPS = config.require('POMELO_WHITELISTED_IPS');
const POMELO_CLIENT_ID = config.require('POMELO_CLIENT_ID');
const POMELO_SECRET_ID = config.require('POMELO_SECRET_ID');
const POMELO_AUDIENCE = config.require('POMELO_AUDIENCE');
const POMELO_AUTH_GRANT_TYPE = config.require('POMELO_AUTH_GRANT_TYPE');
const POMELO_API_URL = config.require('POMELO_API_URL');
const CURRENCY_CONVERSION_API_KEY = config.require(
  'CURRENCY_CONVERSION_API_KEY',
);
const CURRENCY_CONVERSION_API_URL = config.require(
  'CURRENCY_CONVERSION_API_URL',
);
const POMELO_SFTP_HOST = config.require('POMELO_SFTP_HOST');
const POMELO_SFTP_PORT = config.require('POMELO_SFTP_PORT');
const POMELO_SFTP_USR = config.require('POMELO_SFTP_USR');
const POMELO_SFTP_PASSPHRASE = config.require('POMELO_SFTP_PASSPHRASE');

const ecrRepository = new aws.ecr.Repository(
  `erc:repository:${COMPANY_NAME}/${PROJECT_NAME}`,
  {
    name: `${COMPANY_NAME}/${PROJECT_NAME}-${STACK}`,
    imageTagMutability: 'IMMUTABLE',
    imageScanningConfiguration: {
      scanOnPush: true,
    },
    tags: {
      Company: COMPANY_NAME,
      Projects: PROJECT_NAME,
      Stack: STACK,
      CreatedBy: CREATED_BY,
    },
  },
);

export const ecrRepositoryData = {
  id: ecrRepository.id,
  repositoryUrl: ecrRepository.repositoryUrl,
};

const ecrImage = new awsx.ecr.Image(
  `ecr:image:${COMPANY_NAME}/${PROJECT_NAME}-${STACK}`,
  {
    repositoryUrl: ecrRepository.repositoryUrl,
    dockerfile: '../Dockerfile',
    context: '../',
    imageTag: process.env.COMMIT_SHA ?? 'latest',
    platform: 'linux/amd64',
  },
);

export const ecrImageData = {
  imageUri: ecrImage.imageUri,
};

const ec2Vpc = new awsx.ec2.Vpc(
  `ec2:vpc:${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
  {
    enableNetworkAddressUsageMetrics: true,
    numberOfAvailabilityZones: 3,
    cidrBlock: '10.0.0.0/16',
    tags: {
      Company: COMPANY_NAME,
      Projects: PROJECT_NAME,
      Stack: STACK,
      CreatedBy: CREATED_BY,
    },
  },
);

export const ec2VpcData = {
  vpcId: ec2Vpc.vpcId,
  publicSubnetIds: ec2Vpc.publicSubnetIds,
  privateSubnetIds: ec2Vpc.privateSubnetIds,
};

const ec2SecurityGroup = new aws.ec2.SecurityGroup(
  `ec2:security-group:${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
  {
    name: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
    vpcId: ec2Vpc.vpcId,
    egress: [
      {
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        ipv6CidrBlocks: ['::/0'],
      },
    ],
    tags: {
      Company: COMPANY_NAME,
      Projects: PROJECT_NAME,
      Stack: STACK,
      CreatedBy: CREATED_BY,
    },
  },
);

export const ec2SecurityGroupData = {
  id: ec2SecurityGroup.id,
  name: ec2SecurityGroup.name,
  egress: ec2SecurityGroup.egress,
  ingress: ec2SecurityGroup.ingress,
};

const ecsCluster = new aws.ecs.Cluster(`ecs:cluster:${COMPANY_NAME}`, {
  name: `${COMPANY_NAME}-${STACK}`,
  tags: {
    Company: COMPANY_NAME,
    Projects: PROJECT_NAME,
    Stack: STACK,
    CreatedBy: CREATED_BY,
  },
});

export const ecsClusterData = {
  id: ecsCluster.id,
  name: ecsCluster.name,
};

const lbApplicationLoadBalancer = new awsx.lb.ApplicationLoadBalancer(
  `lb:application-load-balancer:${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
  {
    name: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
    enableHttp2: true,
    defaultTargetGroup: {
      name: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
      port: 3000,
    },
    tags: {
      Company: COMPANY_NAME,
      Projects: PROJECT_NAME,
      Stack: STACK,
      CreatedBy: CREATED_BY,
    },
  },
);

export const lbApplicationLoadBalancerData = {
  vpcId: lbApplicationLoadBalancer.vpcId,
  defaultSecurityGroup: lbApplicationLoadBalancer.defaultSecurityGroup,
  defaultTargetGroup: lbApplicationLoadBalancer.defaultTargetGroup,
  loadBalancer: lbApplicationLoadBalancer.loadBalancer,
  listeners: lbApplicationLoadBalancer.listeners,
};

const ecsTaskDefinition = new aws.ecs.TaskDefinition(
  `ecs:task-definition:${COMPANY_NAME}/${PROJECT_NAME}`,
  {
    family: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
    requiresCompatibilities: ['FARGATE'],
    networkMode: 'awsvpc',
    cpu: '1024',
    memory: '2048',
    containerDefinitions: JSON.stringify([
      {
        name: `${COMPANY_NAME}-${PROJECT_NAME}`,
        image: `${COMPANY_NAME}/${PROJECT_NAME}-${STACK}:latest`,
        cpu: 1024,
        memory: 2048,
        essential: true,
        environment: [
          { name: 'ENVIRONMENT', value: ENVIRONMENT },
          { name: 'APP_NAME', value: APP_NAME },
          { name: 'GOOGLE_2FA', value: GOOGLE_2FA },
          { name: 'PORT', value: '3000' },
          { name: 'DATABASE_NAME', value: DATABASE_NAME },
          { name: 'DATABASE_URL', value: DATABASE_URL },
          { name: 'RABBIT_MQ_HOST', value: RABBIT_MQ_HOST },
          { name: 'RABBIT_MQ_PORT', value: RABBIT_MQ_PORT },
          { name: 'RABBIT_MQ_QUEUE', value: RABBIT_MQ_QUEUE },
          { name: 'RABBIT_MQ_USERNAME', value: RABBIT_MQ_USERNAME },
          { name: 'RABBIT_MQ_PASSWORD', value: RABBIT_MQ_PASSWORD },
          { name: 'REDIS_HOST', value: REDIS_HOST },
          { name: 'REDIS_USERNAME', value: REDIS_USERNAME },
          { name: 'REDIS_PASSWORD', value: REDIS_PASSWORD },
          { name: 'REDIS_PORT', value: REDIS_PORT },
          { name: 'CACHE_TTL', value: CACHE_TTL },
          { name: 'CACHE_MAX_ITEMS', value: CACHE_MAX_ITEMS },
          {
            name: 'AUTH_MAX_SECONDS_TO_REFRESH',
            value: AUTH_MAX_SECONDS_TO_REFRESH,
          },
          {
            name: 'OTP_VALIDATION_TIME_SECONDS',
            value: OTP_VALIDATION_TIME_SECONDS,
          },
          { name: 'AUTH_SECRET', value: AUTH_SECRET },
          { name: 'AUTH_EXPIRE_IN', value: AUTH_EXPIRE_IN },
          { name: 'API_KEY_EMAIL_APP', value: API_KEY_EMAIL_APP },
          { name: 'URL_API_EMAIL_APP', value: URL_API_EMAIL_APP },
          { name: 'TESTING', value: TESTING },
          { name: 'TZ', value: TZ },
          { name: 'AWS_SES_FROM_DEFAULT', value: AWS_SES_FROM_DEFAULT },
          { name: 'AWS_SES_HOST', value: '' },
          { name: 'AWS_SES_PORT', value: '' },
          { name: 'AWS_SES_USERNAME', value: '' },
          { name: 'AWS_SES_PASSWORD', value: '' },
          { name: 'DEFAULT_CURRENCY_CONVERSION_COIN', value: 'USD' },
          { name: 'AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE', value: '0.1' },
          { name: 'POMELO_SIGNATURE_SECRET_KEY_DIC', value: '' },
          { name: 'POMELO_WHITELISTED_IPS_CHECK', value: 'OFF' },
          { name: 'POMELO_WHITELISTED_IPS', value: '' },
          { name: 'POMELO_CLIENT_ID', value: '' },
          { name: 'POMELO_SECRET_ID', value: '' },
          { name: 'POMELO_AUDIENCE', value: '' },
          { name: 'POMELO_AUTH_GRANT_TYPE', value: '' },
          { name: 'POMELO_API_URL', value: '' },
          { name: 'CURRENCY_CONVERSION_API_KEY', value: '' },
          { name: 'CURRENCY_CONVERSION_API_URL', value: '' },
          { name: 'POMELO_SFTP_HOST', value: '' },
          { name: 'POMELO_SFTP_PORT', value: '' },
          { name: 'POMELO_SFTP_USR', value: '' },
          { name: 'POMELO_SFTP_PASSPHRASE', value: '' },
        ],
        portMappings: [
          {
            containerPort: 3000,
            hostPort: 3000,
            targetGroup: lbApplicationLoadBalancer.defaultTargetGroup,
          },
        ],
        readonlyRootFilesystem: true,
      },
    ]),
    tags: {
      Company: COMPANY_NAME,
      Projects: PROJECT_NAME,
      Stack: STACK,
      CreatedBy: CREATED_BY,
    },
  },
);

export const ecsTaskDefinitionData = {
  family: ecsTaskDefinition.family,
  revision: ecsTaskDefinition.revision,
  cpu: ecsTaskDefinition.cpu,
  memory: ecsTaskDefinition.memory,
  containerDefinitions: ecsTaskDefinition.containerDefinitions,
  requiresCompatibilities: ecsTaskDefinition.requiresCompatibilities,
  networkMode: ecsTaskDefinition.networkMode,
};

// const ecsFargateService = new awsx.ecs.FargateService(
//   `ecs-fargate-service-${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
//   {
//     name: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
//     // assignPublicIp: true,
//     cluster: ecsCluster.arn,
//     networkConfiguration: {
//       subnets: ec2Vpc.privateSubnetIds,
//       securityGroups: [ec2SecurityGroup.id],
//     },
//     taskDefinition: ecsTaskDefinition.arn,
//     desiredCount: 1,
//     tags: {
//       Company: COMPANY_NAME,
//       Projects: PROJECT_NAME,
//       Stack: STACK,
//       CreatedBy: CREATED_BY,
//     },
//   },
// );

// export const ecsFargateServiceData = {
//   serviceName: ecsFargateService.service.name,
// };

// const appautoscalingTarget = new aws.appautoscaling.Target(
//   `appautoscaling:target:${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
//   {
//     maxCapacity: 10,
//     minCapacity: 1,
//     resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsFargateService.service.name}`,
//     scalableDimension: 'ecs:service:DesiredCount',
//     serviceNamespace: 'ecs',
//   },
// );

// export const appautoscalingTargetData = {
//   resourceId: appautoscalingTarget.resourceId,
//   scalableDimension: appautoscalingTarget.scalableDimension,
//   serviceNamespace: appautoscalingTarget.serviceNamespace,
// };

// const scalingPolicy = new aws.appautoscaling.Policy(
//   `appautoscaling:policy:${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
//   {
//     policyType: 'TargetTrackingScaling',
//     resourceId: appautoscalingTarget.resourceId,
//     scalableDimension: appautoscalingTarget.scalableDimension,
//     serviceNamespace: appautoscalingTarget.serviceNamespace,
//     targetTrackingScalingPolicyConfiguration: {
//       predefinedMetricSpecification: {
//         predefinedMetricType: 'ECSServiceAverageCPUUtilization',
//       },
//       targetValue: 50.0,
//     },
//   },
// );

// export const scalingPolicyData = {
//   name: scalingPolicy.name,
//   policyType: scalingPolicy.policyType,
//   resourceId: scalingPolicy.resourceId,
//   scalableDimension: scalingPolicy.scalableDimension,
//   serviceNamespace: scalingPolicy.serviceNamespace,
//   targetTrackingScalingPolicyConfiguration:
//     scalingPolicy.targetTrackingScalingPolicyConfiguration,
// };
