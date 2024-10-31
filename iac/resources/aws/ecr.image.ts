import * as awsx from '@pulumi/awsx';
import { randomBytes } from 'crypto';
import { join } from 'path';
import { PROJECT_NAME, STACK } from '../../secrets';
import { ecrRepository } from './ecr.repository';

export const TAG = process.env.COMMIT_SHA ?? randomBytes(4).toString('hex');

export const ecrImage = new awsx.ecr.Image(
  `${PROJECT_NAME}/monolith-${STACK}`,
  {
    repositoryUrl: ecrRepository.repositoryUrl,
    dockerfile: join(process.cwd(), '..', 'Dockerfile'),
    context: join(process.cwd(), '..'),
    imageTag: TAG,
    platform: 'linux/amd64',
  },
);
