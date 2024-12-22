import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();

export const SECRETS = pulumi
  .all([
    config.requireSecret('AWS_ACCESS_KEY'),
    config.requireSecret('AWS_SECRET_KEY'),
    config.requireSecret('RABBIT_MQ_USERNAME'),
    config.requireSecret('RABBIT_MQ_PASSWORD'),
    config.requireSecret('MONGOATLAS_PROJECT_ID'),
    config.requireSecret('OPTL_OPEN_SEARCH_USERNAME'),
    config.requireSecret('OPTL_OPEN_SEARCH_PASSWORD'),
  ])
  .apply(
    ([
      AWS_ACCESS_KEY,
      AWS_SECRET_KEY,
      RABBIT_MQ_USERNAME,
      RABBIT_MQ_PASSWORD,
      MONGOATLAS_PROJECT_ID,
      OPTL_OPEN_SEARCH_USERNAME,
      OPTL_OPEN_SEARCH_PASSWORD,
    ]) => ({
      AWS_ACCESS_KEY,
      AWS_SECRET_KEY,
      RABBIT_MQ_USERNAME,
      RABBIT_MQ_PASSWORD,
      MONGOATLAS_PROJECT_ID,
      OPTL_OPEN_SEARCH_USERNAME,
      OPTL_OPEN_SEARCH_PASSWORD,
    }),
  );

export const COMPANY_NAME = 'b2fintech';

export const PROJECT_NAME = 'b2crypto';

export const DOMAIN = 'b2fintech.com';

export const STACK = config.require('STACK');

export const CREATED_BY = 'Pulumi IaC';

export const VPC_CIDR_BLOCK = config.require('VPC_CIDR_BLOCK');

export const DESIRED_COUNT_TASK_OPTL_COLLECTOR = parseInt(
  config.require('DESIRED_COUNT_TASK_OPTL_COLLECTOR'),
);

export const DESIRED_COUNT_TASK_OPTL_UI = parseInt(
  config.require('DESIRED_COUNT_TASK_OPTL_UI'),
);

export const MAX_CAPACITY_AUTOSCALING_OPTL_COLLECTOR = parseInt(
  config.require('MAX_CAPACITY_AUTOSCALING_OPTL_COLLECTOR'),
);

export const MIN_CAPACITY_AUTOSCALING_OPTL_COLLECTOR = parseInt(
  config.require('MIN_CAPACITY_AUTOSCALING_OPTL_COLLECTOR'),
);

export const MAX_CAPACITY_AUTOSCALING_OPTL_UI = parseInt(
  config.require('MAX_CAPACITY_AUTOSCALING_OPTL_UI'),
);

export const MIN_CAPACITY_AUTOSCALING_OPTL_UI = parseInt(
  config.require('MIN_CAPACITY_AUTOSCALING_OPTL_UI'),
);

export const RABBIT_MQ_INSTANCE_TYPE = config.require(
  'RABBIT_MQ_INSTANCE_TYPE',
);

export const MQ_DEPLOYMENT_MODE = config.require('MQ_DEPLOYMENT_MODE');

export const MONGOATLAS_INSTANCE = config.require('MONGOATLAS_INSTANCE');

export const MONGOATLAS_INSTANCE_MIN = config.require(
  'MONGOATLAS_INSTANCE_MIN',
);

export const MONGOATLAS_INSTANCE_MAX = config.require(
  'MONGOATLAS_INSTANCE_MAX',
);

export const MONGOATLAS_CLUSTER_TYPE = config.require(
  'MONGOATLAS_CLUSTER_TYPE',
);

export const SUBDOMAIN_PREFIX_MONGODB = config.require(
  'SUBDOMAIN_PREFIX_MONGODB',
);

export const SUBDOMAIN_PREFIX_RABBITMQ = config.require(
  'SUBDOMAIN_PREFIX_RABBITMQ',
);

export const SUBDOMAIN_PREFIX_OPENSEARCH = config.require(
  'SUBDOMAIN_PREFIX_OPENSEARCH',
);

export const SUBDOMAIN_PREFIX_OPTL_COLLECTOR = config.require(
  'SUBDOMAIN_PREFIX_OPTL_COLLECTOR',
);

export const SUBDOMAIN_PREFIX_OPTL_UI = config.require(
  'SUBDOMAIN_PREFIX_OPTL_UI',
);

export const OPTL_OPEN_SEARCH_INSTANCE_TYPE = config.require(
  'OPTL_OPEN_SEARCH_INSTANCE_TYPE',
);

export const OPTL_OPEN_SEARCH_INSTANCE_COUNT = parseInt(
  config.require('OPTL_OPEN_SEARCH_INSTANCE_COUNT'),
);

export const OPTL_OPEN_SEARCH_ZONE_AWARENESS_ENABLED =
  config.require('OPTL_OPEN_SEARCH_ZONE_AWARENESS_ENABLED') === 'true';

export const OPTL_OPEN_SEARCH_ZONE_AWARENESS_AVAILABILITY_COUNT = parseInt(
  config.require('OPTL_OPEN_SEARCH_ZONE_AWARENESS_AVAILABILITY_COUNT'),
);

export const OPTL_OPEN_SEARCH_EBS_VOLUME_SIZE = parseInt(
  config.require('OPTL_OPEN_SEARCH_EBS_VOLUME_SIZE'),
);

export const TAGS = {
  Company: COMPANY_NAME,
  Projects: PROJECT_NAME,
  Stack: STACK,
  CreatedBy: CREATED_BY,
};

export const isProduction = () => STACK === 'production';
export const isTesting = () => STACK === 'testing';
export const isStressTest = () => STACK === 'testing_stress';

export const mongoAtlasClusterName = `${PROJECT_NAME}-monolith-${STACK}`;
