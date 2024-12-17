import * as aws from '@pulumi/aws';
import { PROJECT_NAME, STACK } from '../../secrets';

export const ecrRepository = aws.ecr.getRepositoryOutput({
  name: `${PROJECT_NAME}/monolith-${STACK}`,
});
