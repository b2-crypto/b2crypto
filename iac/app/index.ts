import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import { randomBytes } from 'crypto';
import { VARS_ENV } from './secrets';

const { COMPANY_NAME, PROJECT_NAME, STACK, CREATED_BY } = VARS_ENV;
const TAG = process.env.COMMIT_SHA ?? randomBytes(4).toString('hex');

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
  repositoryUrl: ecrRepository.repositoryUrl.apply(
    (value) => `${value.split('@').at(0)}:${TAG}`,
  ),
};

const ecrImage = new awsx.ecr.Image(
  `ecr:image:${COMPANY_NAME}/${PROJECT_NAME}-${STACK}`,
  {
    repositoryUrl: ecrRepository.repositoryUrl,
    dockerfile: '../../Dockerfile',
    context: '../../',
    imageTag: TAG,
    platform: 'linux/amd64',
  },
);

export const ecrImageData = {
  imageUri: ecrImage.imageUri.apply(
    (imageUri) => `${imageUri.split('@').at(0)}:${TAG}`,
  ),
};
