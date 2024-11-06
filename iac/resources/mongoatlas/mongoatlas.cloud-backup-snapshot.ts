import * as mongodbatlas from '@pulumi/mongodbatlas';
import { mongoAtlasClusterName, SECRETS } from '../../secrets';

export const mongodbatlasCloudBackupSnapshot =
  new mongodbatlas.CloudBackupSnapshot(mongoAtlasClusterName, {
    projectId: SECRETS.MONGOATLAS_PROJECT_ID,
    clusterName: mongoAtlasClusterName,
    description: 'Backup snapshot for cluster ' + mongoAtlasClusterName,
    retentionInDays: 30,
  });
