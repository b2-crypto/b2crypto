import * as aws from '@pulumi/aws';
import { PROJECT_NAME, REDIS_PORT, SECRETS, STACK, TAGS } from '../../secrets';
import { ec2SecurityGroupRedis } from './ec2.security-group';
import { ec2Vpc } from './ec2.vpc';

export const elasticacheSubnetGroupRedis = new aws.elasticache.SubnetGroup(
  `${PROJECT_NAME}-subnet-group-${STACK}`,
  {
    name: `${PROJECT_NAME}-subnet-group-${STACK}`,
    subnetIds: ec2Vpc.publicSubnetIds,
    description: 'Subnet group for Redis',
    tags: TAGS,
  },
);

export const elasticacheReplicationGroupRedis =
  new aws.elasticache.ReplicationGroup(`${PROJECT_NAME}-elasticache-${STACK}`, {
    authToken: SECRETS.REDIS_PASSWORD,
    clusterMode: 'disabled',
    description: 'Redis replication group',
    engine: 'redis',
    engineVersion: '7.1',
    multiAzEnabled: false,
    networkType: 'ipv4',
    nodeType: 'cache.t2.small',
    numCacheClusters: 1,
    port: parseInt(REDIS_PORT),
    securityGroupIds: [ec2SecurityGroupRedis.id],
    subnetGroupName: elasticacheSubnetGroupRedis.name,
    transitEncryptionEnabled: true,
    tags: TAGS,
  });
