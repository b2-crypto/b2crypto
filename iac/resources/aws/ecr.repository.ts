import * as aws from '@pulumi/aws';
import { PROJECT_NAME, STACK, TAGS } from '../../secrets';

export const ecrRepository = new aws.ecr.Repository(
  `${PROJECT_NAME}/monolith-${STACK}`,
  {
    name: `${PROJECT_NAME}/monolith-${STACK}`,
    imageTagMutability: 'MUTABLE',
    imageScanningConfiguration: {
      scanOnPush: true,
    },
    forceDelete: true,
    tags: TAGS,
  },
);
