import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();

export const VARS_ENV = {
  COMPANY_NAME: 'b2crypto',
  PROJECT_NAME: 'monolith',
  STACK: config.require('STACK'),
  CREATED_BY: 'Pulumi IaC',
};
