import * as mongodbatlas from '@pulumi/mongodbatlas';
import {
  isProduction,
  isStressTest,
  MONGOATLAS_CLUSTER_TYPE,
  MONGOATLAS_INSTANCE,
  MONGOATLAS_INSTANCE_MAX,
  MONGOATLAS_INSTANCE_MIN,
  mongoAtlasClusterName,
  SECRETS,
  TAGS,
} from '../../secrets';

export const mongoAtlasCluster = isStressTest()
  ? new mongodbatlas.Cluster(
      mongoAtlasClusterName,
      {
        projectId: SECRETS.MONGOATLAS_PROJECT_ID,
        name: mongoAtlasClusterName,
        providerName: 'AWS',
        providerInstanceSizeName: MONGOATLAS_INSTANCE,
        providerRegionName: 'US_EAST_1',
        mongoDbMajorVersion: '7.0',
        clusterType: MONGOATLAS_CLUSTER_TYPE,
        autoScalingComputeEnabled: true,
        autoScalingComputeScaleDownEnabled: true,
        providerAutoScalingComputeMinInstanceSize: MONGOATLAS_INSTANCE_MIN,
        providerAutoScalingComputeMaxInstanceSize: MONGOATLAS_INSTANCE_MAX,
        replicationSpecs: [
          {
            numShards: 1,
            regionsConfigs: [
              {
                regionName: 'US_EAST_1',
                electableNodes: 3,
                priority: isProduction() || isStressTest() ? 7 : 1,
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
        // protect: isProduction(),
      },
    )
  : null;

export const mongoAtlasClusterExisting = isProduction()
  ? mongodbatlas.getClusterOutput({
      projectId: SECRETS.MONGOATLAS_PROJECT_ID,
      name: 'b2fintech',
    })
  : null;
