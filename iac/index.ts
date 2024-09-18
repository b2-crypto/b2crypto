import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';
import { SECRETS, VARS_ENV } from './secrets';

const {
  COMPANY_NAME,
  PROJECT_NAME,
  STACK,
  CREATED_BY,
  ENVIRONMENT,
  PORT,
  APP_NAME,
  GOOGLE_2FA,
  DATABASE_NAME,
  RABBIT_MQ_PORT,
  RABBIT_MQ_QUEUE,
  REDIS_PORT,
  CACHE_TTL,
  CACHE_MAX_ITEMS,
  AUTH_MAX_SECONDS_TO_REFRESH,
  AUTH_EXPIRE_IN,
  API_KEY_EMAIL_APP,
  URL_API_EMAIL_APP,
  TESTING,
  TZ,
  AWS_SES_PORT,
  DEFAULT_CURRENCY_CONVERSION_COIN,
  AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE,
  POMELO_WHITELISTED_IPS_CHECK,
} = VARS_ENV;
VARS_ENV;

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
    containerDefinitions: SECRETS.apply((secrets) =>
      JSON.stringify([
        {
          name: `${COMPANY_NAME}-${PROJECT_NAME}`,
          image: `${ecrImage.imageUri}:${process.env.COMMIT_SHA ?? 'latest'}`,
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
              value: secrets.DATABASE_URL,
            },
            {
              name: 'RABBIT_MQ_HOST',
              value: secrets.RABBIT_MQ_HOST,
            },
            { name: 'RABBIT_MQ_PORT', value: RABBIT_MQ_PORT },
            { name: 'RABBIT_MQ_QUEUE', value: RABBIT_MQ_QUEUE },
            {
              name: 'RABBIT_MQ_USERNAME',
              value: secrets.RABBIT_MQ_USERNAME,
            },
            {
              name: 'RABBIT_MQ_PASSWORD',
              value: secrets.RABBIT_MQ_PASSWORD,
            },
            {
              name: 'REDIS_HOST',
              value: secrets.REDIS_HOST,
            },
            {
              name: 'REDIS_USERNAME',
              value: secrets.REDIS_USERNAME,
            },
            {
              name: 'REDIS_PASSWORD',
              value: secrets.REDIS_PASSWORD,
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
              value: secrets.AUTH_SECRET,
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
              value: secrets.AWS_SES_FROM_DEFAULT,
            },
            {
              name: 'AWS_SES_HOST',
              value: secrets.AWS_SES_HOST,
            },
            { name: 'AWS_SES_PORT', value: AWS_SES_PORT },
            {
              name: 'AWS_SES_USERNAME',
              value: secrets.AWS_SES_USERNAME,
            },
            {
              name: 'AWS_SES_PASSWORD',
              value: secrets.AWS_SES_PASSWORD,
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
              value: secrets.POMELO_SIGNATURE_SECRET_KEY_DIC,
            },
            {
              name: 'POMELO_WHITELISTED_IPS_CHECK',
              value: POMELO_WHITELISTED_IPS_CHECK,
            },
            {
              name: 'POMELO_WHITELISTED_IPS',
              value: secrets.POMELO_WHITELISTED_IPS,
            },
            {
              name: 'POMELO_CLIENT_ID',
              value: secrets.POMELO_CLIENT_ID,
            },
            {
              name: 'POMELO_SECRET_ID',
              value: secrets.POMELO_SECRET_ID,
            },
            {
              name: 'POMELO_AUDIENCE',
              value: secrets.POMELO_AUDIENCE,
            },
            {
              name: 'POMELO_AUTH_GRANT_TYPE',
              value: secrets.POMELO_AUTH_GRANT_TYPE,
            },
            {
              name: 'POMELO_API_URL',
              value: secrets.POMELO_API_URL,
            },
            {
              name: 'CURRENCY_CONVERSION_API_KEY',
              value: secrets.CURRENCY_CONVERSION_API_KEY,
            },
            {
              name: 'CURRENCY_CONVERSION_API_URL',
              value: secrets.CURRENCY_CONVERSION_API_URL,
            },
            {
              name: 'POMELO_SFTP_HOST',
              value: secrets.POMELO_SFTP_HOST,
            },
            {
              name: 'POMELO_SFTP_PORT',
              value: secrets.POMELO_SFTP_PORT,
            },
            {
              name: 'POMELO_SFTP_USR',
              value: secrets.POMELO_SFTP_USR,
            },
            {
              name: 'POMELO_SFTP_PASSPHRASE',
              value: secrets.POMELO_SFTP_PASSPHRASE,
            },
          ],
          portMappings: [
            {
              containerPort: parseInt(PORT),
              hostPort: parseInt(PORT),
              targetGroup: lbApplicationLoadBalancer.defaultTargetGroup,
            },
          ],
          readonlyRootFilesystem: true,
        },
      ]),
    ),
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

const ecsFargateService = new awsx.ecs.FargateService(
  `ecs-fargate-service-${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
  {
    name: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
    // assignPublicIp: true,
    cluster: ecsCluster.arn,
    networkConfiguration: {
      subnets: ec2Vpc.privateSubnetIds,
      securityGroups: [ec2SecurityGroup.id],
    },
    taskDefinition: ecsTaskDefinition.arn,
    desiredCount: 1,
    tags: {
      Company: COMPANY_NAME,
      Projects: PROJECT_NAME,
      Stack: STACK,
      CreatedBy: CREATED_BY,
    },
  },
);

export const ecsFargateServiceData = {
  serviceName: ecsFargateService.service.name,
};

const appautoscalingTarget = new aws.appautoscaling.Target(
  `appautoscaling:target:${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
  {
    maxCapacity: 10,
    minCapacity: 1,
    resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsFargateService.service.name}`,
    scalableDimension: 'ecs:service:DesiredCount',
    serviceNamespace: 'ecs',
  },
);

export const appautoscalingTargetData = {
  resourceId: appautoscalingTarget.resourceId,
  scalableDimension: appautoscalingTarget.scalableDimension,
  serviceNamespace: appautoscalingTarget.serviceNamespace,
};

const scalingPolicy = new aws.appautoscaling.Policy(
  `appautoscaling:policy:${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
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

export const scalingPolicyData = {
  name: scalingPolicy.name,
  policyType: scalingPolicy.policyType,
  resourceId: scalingPolicy.resourceId,
  scalableDimension: scalingPolicy.scalableDimension,
  serviceNamespace: scalingPolicy.serviceNamespace,
  targetTrackingScalingPolicyConfiguration:
    scalingPolicy.targetTrackingScalingPolicyConfiguration,
};
