import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as mongodbatlas from '@pulumi/mongodbatlas';
import * as pulumi from '@pulumi/pulumi';
import { randomBytes } from 'crypto';
import {
  API_KEY_EMAIL_APP,
  APP_NAME,
  AUTH_EXPIRE_IN,
  AUTH_MAX_SECONDS_TO_REFRESH,
  AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE,
  AWS_SES_PORT,
  CACHE_MAX_ITEMS,
  CACHE_TTL,
  COMPANY_NAME,
  CREATED_BY,
  DATABASE_NAME,
  DEFAULT_CURRENCY_CONVERSION_COIN,
  DESIRED_COUNT_TASK,
  ENVIRONMENT,
  GOOGLE_2FA,
  LOGO_URL,
  MAX_CAPACITY_AUTOSCALING,
  MIN_CAPACITY_AUTOSCALING,
  MONGOATLAS_CLUSTER_TYPE,
  MONGOATLAS_INSTANCE,
  MONGOATLAS_INSTANCE_MAX,
  MONGOATLAS_INSTANCE_MIN,
  MQ_DEPLOYMENT_MODE,
  POMELO_WHITELISTED_IPS_CHECK,
  PORT,
  PROJECT_NAME,
  RABBIT_MQ_INSTANCE_TYPE,
  RABBIT_MQ_PORT,
  RABBIT_MQ_QUEUE,
  REDIS_PORT,
  SECRETS,
  SOCIAL_MEDIA_ICONS,
  SOCIAL_MEDIA_LINKS,
  STACK,
  SUBDOMAIN_PREFIX,
  TESTING,
  TESTING_MODE,
  TZ,
  URL_API_EMAIL_APP,
  VPC_CIDR_BLOCK,
} from './secrets';

const TAGS = {
  Company: COMPANY_NAME,
  Projects: PROJECT_NAME,
  Stack: STACK,
  CreatedBy: CREATED_BY,
};
const TAG = process.env.COMMIT_SHA ?? randomBytes(4).toString('hex');
const isProduction = () => ENVIRONMENT === 'PROD';
const isStressTest = () =>
  TESTING_MODE === 'STRESS_TEST' && ENVIRONMENT === 'TEST';
const DOMAIN = 'b2fintech.com';

// const acmCertificate = new aws.acm.Certificate(
//   `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
//   {
//     domainName: DOMAIN,
//     subjectAlternativeNames: [`*.${DOMAIN}`],
//     validationMethod: 'DNS',
//     tags: TAGS,
//   },
// );

const acmCertificate = aws.acm.getCertificateOutput({
  domain: DOMAIN,
});

export const acmCertificateData = {
  arn: acmCertificate.arn,
  domain: acmCertificate.domain,
};

const route53Zone = aws.route53.getZoneOutput({ name: DOMAIN });

export const route53ZoneData = {
  id: route53Zone.id,
  name: route53Zone.name,
};

// const route53RecordValidation = new aws.route53.Record(
//   `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}-validation`,
//   {
//     zoneId: route53Zone.zoneId,
//     name: acmCertificate.domainValidationOptions[0].resourceRecordName,
//     type: acmCertificate.domainValidationOptions[0].resourceRecordType,
//     records: [acmCertificate.domainValidationOptions[0].resourceRecordValue],
//     ttl: 300,
//   },
// );

// export const route53RecordValidationData = {
//   name: route53RecordValidation.name,
//   type: route53RecordValidation.type,
//   zoneId: route53RecordValidation.zoneId,
//   fqdn: route53RecordValidation.fqdn,
// };

// const certificateValidation = new aws.acm.CertificateValidation(
//   `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
//   {
//     certificateArn: acmCertificate.arn,
//     validationRecordFqdns: [route53RecordValidation.fqdn],
//   },
// );

// export const certificateValidationData = {
//   certificateArn: certificateValidation.certificateArn,
//   validationRecordFqdns: certificateValidation.validationRecordFqdns,
// };

const mongoAtlasClusterName = isStressTest()
  ? `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}-stress`
  : `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`;

const mongodbatlasServerlessInstance =
  !isStressTest() && !isProduction()
    ? new mongodbatlas.ServerlessInstance(mongoAtlasClusterName, {
        name: mongoAtlasClusterName,
        projectId: SECRETS.MONGOATLAS_PROJECT_ID,
        providerSettingsRegionName: 'US_EAST_1',
        providerSettingsProviderName: 'AWS',
        terminationProtectionEnabled: true,
        continuousBackupEnabled: false,
        stateName: 'IDLE',
        providerSettingsBackingProviderName: 'AWS',
        tags: Object.entries(TAGS).map(([key, value]) => ({
          key,
          value,
        })),
      })
    : null;

export const mongodbatlasServerlessInstanceData =
  mongodbatlasServerlessInstance;

const mongoAtlasCluster =
  isStressTest() || isProduction()
    ? new mongodbatlas.Cluster(
        mongoAtlasClusterName,
        {
          projectId: SECRETS.MONGOATLAS_PROJECT_ID,
          name: mongoAtlasClusterName,
          providerName: 'AWS',
          providerInstanceSizeName: isStressTest()
            ? 'M20'
            : MONGOATLAS_INSTANCE,
          providerRegionName: 'US_EAST_1',
          mongoDbMajorVersion: '7.0',
          clusterType: MONGOATLAS_CLUSTER_TYPE,
          autoScalingComputeEnabled: true,
          autoScalingComputeScaleDownEnabled: true,
          providerAutoScalingComputeMinInstanceSize: isStressTest()
            ? 'M10'
            : MONGOATLAS_INSTANCE_MIN,
          providerAutoScalingComputeMaxInstanceSize: isStressTest()
            ? 'M30'
            : MONGOATLAS_INSTANCE_MAX,
          replicationSpecs: [
            {
              numShards: 1,
              regionsConfigs: [
                {
                  regionName: 'US_EAST_1',
                  electableNodes: 3,
                  priority: 1,
                },
              ],
            },
          ],
          tags: Object.entries(TAGS).map(([key, value]) => ({
            key,
            value,
          })),
        },
        {
          protect: isProduction(),
        },
      )
    : null;

export const mongoAtlasClusterData = mongoAtlasCluster;

const ecrRepository = new aws.ecr.Repository(
  `${COMPANY_NAME}/${PROJECT_NAME}-${STACK}`,
  {
    name: `${COMPANY_NAME}/${PROJECT_NAME}-${STACK}`,
    imageTagMutability: 'MUTABLE',
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

const mqBrokerRabbitMQ = new aws.mq.Broker(
  `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}-rabbit-mq`,
  {
    brokerName: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}-rabbit-mq`,
    engineType: 'RABBITMQ',
    engineVersion: '3.13',
    hostInstanceType: RABBIT_MQ_INSTANCE_TYPE,
    publiclyAccessible: true,
    users: [
      {
        username: SECRETS.RABBIT_MQ_USERNAME,
        password: SECRETS.RABBIT_MQ_PASSWORD,
      },
    ],
    subnetIds:
      MQ_DEPLOYMENT_MODE === 'SINGLE_INSTANCE'
        ? ec2Vpc.publicSubnetIds.apply((subnets) => [...subnets].slice(0, 1))
        : [],
    logs: {
      general: true,
      audit: false,
    },
    autoMinorVersionUpgrade: true,
    deploymentMode: MQ_DEPLOYMENT_MODE,
    authenticationStrategy: 'SIMPLE',
    tags: TAGS,
  },
);

export const mqBrokerRabbitMQData = {
  id: mqBrokerRabbitMQ.id,
  brokerName: mqBrokerRabbitMQ.brokerName,
  instances: mqBrokerRabbitMQ.instances,
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

const rouet53Record = new aws.route53.Record(
  `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
  {
    zoneId: route53Zone.id,
    name: SUBDOMAIN_PREFIX,
    type: 'A',
    aliases: [
      {
        name: lbApplicationLoadBalancer.loadBalancer.dnsName,
        zoneId: lbApplicationLoadBalancer.loadBalancer.zoneId,
        evaluateTargetHealth: true,
      },
    ],
  },
);

export const rouet53RecordData = {
  name: rouet53Record.name,
  type: rouet53Record.type,
  zoneId: rouet53Record.zoneId,
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
      container: {
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
            value: pulumi
              .all([
                mongoAtlasCluster?.connectionStrings.apply(
                  (connections) => connections[0].standardSrv,
                ) ??
                  mongodbatlasServerlessInstance?.connectionStringsStandardSrv,
                SECRETS.MONGOATLAS_USERNAME,
                SECRETS.MONGOATLAS_PASSWORD,
              ])
              .apply(([standardSrv, username, password]) => {
                const [protocol, domain] = standardSrv?.split('//') ?? [];

                return `${protocol}//${username}:${password}@${domain}/?retryWrites=true&w=majority&appName=${mongoAtlasClusterName}`;
              }),
            // value: SECRETS.DATABASE_URL,
          },
          {
            name: 'RABBIT_MQ_HOST',
            value: mqBrokerRabbitMQ.instances.apply(
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
      },
    },
    desiredCount: isStressTest() ? 3 : parseInt(DESIRED_COUNT_TASK),
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
    maxCapacity: isStressTest() ? 10 : parseInt(MAX_CAPACITY_AUTOSCALING),
    minCapacity: isStressTest() ? 3 : parseInt(MIN_CAPACITY_AUTOSCALING),
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
