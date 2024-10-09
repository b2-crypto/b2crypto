import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';
import { randomBytes } from 'crypto';
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
  VPC_CIDR_BLOCK,
  DESIRED_COUNT_TASK,
  MAX_CAPACITY_AUTOSCALING,
  MIN_CAPACITY_AUTOSCALING,
} = VARS_ENV;
const TAGS = {
  Company: COMPANY_NAME,
  Projects: PROJECT_NAME,
  Stack: STACK,
  CreatedBy: CREATED_BY,
};
const TAG = process.env.COMMIT_SHA ?? randomBytes(4).toString('hex');

const acmCertificate = aws.acm.getCertificateOutput({
  domain: 'b2crypto.com',
});

export const acmCertificateData = {
  arn: acmCertificate.arn,
  domain: acmCertificate.domain,
};

const ecrRepository = new aws.ecr.Repository(
  `${COMPANY_NAME}/${PROJECT_NAME}-${STACK}`,
  {
    name: `${COMPANY_NAME}/${PROJECT_NAME}-${STACK}`,
    imageTagMutability: 'IMMUTABLE',
    imageScanningConfiguration: {
      scanOnPush: true,
    },
    forceDelete: true,
    tags: TAGS,
  },
);

export const ecrRepositoryData = {
  id: ecrRepository.id,
  repositoryUrl: ecrRepository.repositoryUrl.apply((value) =>
    value.split('@').at(0),
  ),
};

const ecrImage = new awsx.ecr.Image(
  `${COMPANY_NAME}/${PROJECT_NAME}-${STACK}`,
  {
    repositoryUrl: ecrRepository.repositoryUrl,
    dockerfile: '../Dockerfile',
    context: '../',
    imageTag: TAG,
    platform: 'linux/amd64',
  },
);

export const ecrImageData = {
  imageUri: ecrImage.imageUri.apply(
    (imageUri) => `${imageUri.split('@').at(0)}:${TAG}`,
  ),
};

const ec2Vpc = new awsx.ec2.Vpc(`${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`, {
  enableNetworkAddressUsageMetrics: true,
  numberOfAvailabilityZones: 3,
  cidrBlock: VPC_CIDR_BLOCK,
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: TAGS,
});

export const ec2VpcData = {
  vpcId: ec2Vpc.vpcId,
  publicSubnetIds: ec2Vpc.publicSubnetIds,
  privateSubnetIds: ec2Vpc.privateSubnetIds,
};

const ec2SecurityGroup = new aws.ec2.SecurityGroup(
  `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
  {
    name: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
    vpcId: ec2Vpc.vpcId,
    ingress: [
      {
        fromPort: 443,
        toPort: 443,
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        fromPort: parseInt(PORT),
        toPort: parseInt(PORT),
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        fromPort: parseInt(RABBIT_MQ_PORT),
        toPort: parseInt(RABBIT_MQ_PORT),
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        fromPort: parseInt(REDIS_PORT),
        toPort: parseInt(REDIS_PORT),
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    egress: [
      {
        fromPort: 443,
        toPort: 443,
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        fromPort: parseInt(PORT),
        toPort: parseInt(PORT),
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        fromPort: parseInt(RABBIT_MQ_PORT),
        toPort: parseInt(RABBIT_MQ_PORT),
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        fromPort: parseInt(REDIS_PORT),
        toPort: parseInt(REDIS_PORT),
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        fromPort: SECRETS.POMELO_SFTP_PORT.apply((value) => parseInt(value)),
        toPort: SECRETS.POMELO_SFTP_PORT.apply((value) => parseInt(value)),
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        fromPort: parseInt(AWS_SES_PORT),
        toPort: parseInt(AWS_SES_PORT),
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        fromPort: 27015,
        toPort: 27017,
        protocol: 'TCP',
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: TAGS,
  },
);

export const ec2SecurityGroupData = {
  id: ec2SecurityGroup.id,
  name: ec2SecurityGroup.name,
  egress: ec2SecurityGroup.egress,
  ingress: ec2SecurityGroup.ingress,
};

const ecsCluster = new aws.ecs.Cluster(`${COMPANY_NAME}`, {
  name: `${STACK}`,
  tags: TAGS,
});

export const ecsClusterData = {
  id: ecsCluster.id,
  name: ecsCluster.name,
};

const lbApplicationLoadBalancer = new awsx.lb.ApplicationLoadBalancer(
  `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
  {
    name: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
    enableHttp2: true,
    defaultTargetGroup: {
      name: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
      protocol: 'HTTP',
      port: parseInt(PORT),
      vpcId: ec2Vpc.vpcId,
      tags: TAGS,
      healthCheck: {
        path: '/health',
        interval: 5,
        timeout: 3,
      },
    },
    securityGroups: [ec2SecurityGroup.id],
    subnetIds: ec2Vpc.publicSubnetIds,
    listeners: [
      {
        port: 443,
        protocol: 'HTTPS',
        certificateArn: acmCertificate.arn,
        tags: TAGS,
      },
    ],
    tags: TAGS,
  },
);

export const lbApplicationLoadBalancerData = {
  vpcId: lbApplicationLoadBalancer.vpcId,
  defaultSecurityGroup: lbApplicationLoadBalancer.defaultSecurityGroup,
  defaultTargetGroup: lbApplicationLoadBalancer.defaultTargetGroup,
  loadBalancer: lbApplicationLoadBalancer.loadBalancer,
  listeners: lbApplicationLoadBalancer.listeners,
};

const cloudwatchLogGroup = new aws.cloudwatch.LogGroup(
  `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
  {
    name: `${COMPANY_NAME}/ecs/task/${PROJECT_NAME}-${STACK}`,
    retentionInDays: 30,
    tags: TAGS,
  },
);

export const cloudwatchLogGroupData = {
  id: cloudwatchLogGroup.id,
  name: cloudwatchLogGroup.name,
};

const ecsFargateService = new awsx.ecs.FargateService(
  `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
  {
    name: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
    // assignPublicIp: true,
    cluster: ecsCluster.arn,
    propagateTags: 'SERVICE',
    networkConfiguration: {
      subnets: ec2Vpc.publicSubnetIds,
      securityGroups: [ec2SecurityGroup.id],
      assignPublicIp: true,
    },
    taskDefinitionArgs: {
      family: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
      cpu: '1024',
      memory: '2048',
      container: SECRETS.apply((secrets) => ({
        name: `${PROJECT_NAME}`,
        image: ecrImageData.imageUri,
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
            name: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
            containerPort: parseInt(PORT),
            hostPort: parseInt(PORT),
            protocol: 'tcp',
            targetGroup: lbApplicationLoadBalancer.defaultTargetGroup,
          },
        ],
        readonlyRootFilesystem: true,
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
      })),
    },
    desiredCount: parseInt(DESIRED_COUNT_TASK),
    deploymentMinimumHealthyPercent: 100,
    deploymentMaximumPercent: 200,
    enableEcsManagedTags: true,
    tags: TAGS,
  },
);

export const ecsFargateServiceData = {
  serviceName: ecsFargateService.service.name,
};

const cloudwatchDashboard = new aws.cloudwatch.Dashboard(
  `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
  {
    dashboardName: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
    dashboardBody: pulumi
      .all([ecsCluster.name, ecsFargateService.service.name])
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

export const cloudwatchDashboardData = {
  dashboardName: cloudwatchDashboard.dashboardName,
};

const appautoscalingTarget = new aws.appautoscaling.Target(
  `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
  {
    maxCapacity: parseInt(MAX_CAPACITY_AUTOSCALING),
    minCapacity: parseInt(MIN_CAPACITY_AUTOSCALING),
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
  `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
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
