import { ecrImage, TAG } from './resources/aws/ecr.image';
import { ecrRepository } from './resources/aws/ecr.repository';
import { ecsCluster } from './resources/aws/ecs.cluster';
import { ecsFargateService } from './resources/aws/ecs.fargate-service';
import { lbApplicationLoadBalancer } from './resources/aws/lb.application-load-balancer';
import { mqBrokerRabbitMQ } from './resources/aws/mq.broker';
import { mongoAtlasCluster } from './resources/mongoatlas/mongodbatlas.cluster';
import { mongodbatlasServerlessInstance } from './resources/mongoatlas/mongodbatlas.serverless-instance';

export const mongodbatlasServerlessInstanceData =
  mongodbatlasServerlessInstance;

export const mongoAtlasClusterData = mongoAtlasCluster;

export const ecrRepositoryData = {
  id: ecrRepository.id,
  repositoryUrl: ecrRepository.repositoryUrl.apply((value) =>
    value.split('@').at(0),
  ),
};

export const ecrImageData = {
  imageUri: ecrImage.imageUri.apply(
    (imageUri) => `${imageUri.split('@').at(0)}:${TAG}`,
  ),
};

export const mqBrokerRabbitMQData = {
  id: mqBrokerRabbitMQ.id,
  brokerName: mqBrokerRabbitMQ.brokerName,
  instances: mqBrokerRabbitMQ.instances,
};

export const ecsClusterData = {
  id: ecsCluster.id,
  clusterName: ecsCluster.clusterName,
};

export const ecsFargateServiceData = {
  serviceName: ecsFargateService.service.name,
};

export const lbApplicationLoadBalancerData = {
  vpcId: lbApplicationLoadBalancer.vpcId,
  defaultSecurityGroup: lbApplicationLoadBalancer.defaultSecurityGroup,
  defaultTargetGroup: lbApplicationLoadBalancer.defaultTargetGroup,
  loadBalancer: lbApplicationLoadBalancer.loadBalancer,
  listeners: lbApplicationLoadBalancer.listeners,
};
