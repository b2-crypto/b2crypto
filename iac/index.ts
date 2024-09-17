import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const COMPANY_NAME = 'b2crypto';
const PROJECT_NAME = 'monolith';
const STACK = config.require('STACK');
const CREATED_BY = 'Pulumi IaC';
const ENVIRONMENT = config.require('ENVIRONMENT');

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

// const ec2SecurityGroup = new aws.ec2.SecurityGroup(
//   `ec2:security-group:${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
//   {
//     name: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
//     vpcId: ec2Vpc.vpcId,
//     egress: [
//       {
//         fromPort: 0,
//         toPort: 0,
//         protocol: '-1',
//         cidrBlocks: ['0.0.0.0/0'],
//         ipv6CidrBlocks: ['::/0'],
//       },
//     ],
//     tags: {
//       Company: COMPANY_NAME,
//       Projects: PROJECT_NAME,
//       Stack: STACK,
//       CreatedBy: CREATED_BY,
//     },
//   },
// );

// export const ec2SecurityGroupData = {
//   id: ec2SecurityGroup.id,
//   name: ec2SecurityGroup.name,
//   egress: ec2SecurityGroup.egress,
//   ingress: ec2SecurityGroup.ingress,
// };

// const ecsCluster = new aws.ecs.Cluster(`ecs:cluster:${COMPANY_NAME}`, {
//   name: `${COMPANY_NAME}-${STACK}`,
//   tags: {
//     Company: COMPANY_NAME,
//     Projects: PROJECT_NAME,
//     Stack: STACK,
//     CreatedBy: CREATED_BY,
//   },
// });

// export const ecsClusterData = {
//   id: ecsCluster.id,
//   name: ecsCluster.name,
// };

// const lbApplicationLoadBalancer = new awsx.lb.ApplicationLoadBalancer(
//   `lb:application-load-balancer:${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
//   {
//     name: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
//     enableHttp2: true,
//     defaultTargetGroup: {
//       name: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
//       port: 3000,
//     },
//     tags: {
//       Company: COMPANY_NAME,
//       Projects: PROJECT_NAME,
//       Stack: STACK,
//       CreatedBy: CREATED_BY,
//     },
//   },
// );

// export const lbApplicationLoadBalancerData = {
//   vpcId: lbApplicationLoadBalancer.vpcId,
//   defaultSecurityGroup: lbApplicationLoadBalancer.defaultSecurityGroup,
//   defaultTargetGroup: lbApplicationLoadBalancer.defaultTargetGroup,
//   loadBalancer: lbApplicationLoadBalancer.loadBalancer,
//   listeners: lbApplicationLoadBalancer.listeners,
// };

// const ecsTaskDefinition = new aws.ecs.TaskDefinition(
//   `ecs:task-definition:${COMPANY_NAME}/${PROJECT_NAME}`,
//   {
//     family: `${COMPANY_NAME}-${PROJECT_NAME}-${STACK}`,
//     requiresCompatibilities: ['FARGATE'],
//     networkMode: 'awsvpc',
//     cpu: '1024',
//     memory: '2048',
//     containerDefinitions: JSON.stringify([
//       {
//         name: `${COMPANY_NAME}-${PROJECT_NAME}`,
//         image: `${COMPANY_NAME}/${PROJECT_NAME}-${STACK}:latest`,
//         cpu: 1024,
//         memory: 2048,
//         essential: true,
//         environment: [{ name: 'ENVIRONMENT', value: ENVIRONMENT }],
//         portMappings: [
//           {
//             containerPort: 3000,
//             hostPort: 3000,
//             targetGroup: lbApplicationLoadBalancer.defaultTargetGroup,
//           },
//         ],
//         readonlyRootFilesystem: true,
//       },
//     ]),
//     tags: {
//       Company: COMPANY_NAME,
//       Projects: PROJECT_NAME,
//       Stack: STACK,
//       CreatedBy: CREATED_BY,
//     },
//   },
// );

// export const ecsTaskDefinitionData = {
//   family: ecsTaskDefinition.family,
//   revision: ecsTaskDefinition.revision,
//   cpu: ecsTaskDefinition.cpu,
//   memory: ecsTaskDefinition.memory,
//   containerDefinitions: ecsTaskDefinition.containerDefinitions,
//   requiresCompatibilities: ecsTaskDefinition.requiresCompatibilities,
//   networkMode: ecsTaskDefinition.networkMode,
// };

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
