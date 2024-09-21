import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import { randomBytes } from 'crypto';
import { VARS_ENV } from './secrets';

const { COMPANY_NAME, PROJECT_NAME, STACK } = VARS_ENV;
const TAG = process.env.COMMIT_SHA ?? randomBytes(4).toString('hex');

const ecrRepository = aws.ecr.getRepositoryOutput({
  name: `${COMPANY_NAME}/${PROJECT_NAME}-${STACK}`,
});

export const ecrRepositoryData = {
  id: ecrRepository.id,
  repositoryUrl: ecrRepository.repositoryUrl,
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
