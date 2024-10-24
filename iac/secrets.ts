import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();

export const SECRETS = pulumi
  .all([
    config.requireSecret('DATABASE_URL'),
    config.requireSecret('RABBIT_MQ_HOST'),
    config.requireSecret('RABBIT_MQ_USERNAME'),
    config.requireSecret('RABBIT_MQ_PASSWORD'),
    config.requireSecret('REDIS_HOST'),
    config.requireSecret('REDIS_USERNAME'),
    config.requireSecret('REDIS_PASSWORD'),
    config.requireSecret('AUTH_SECRET'),
    config.requireSecret('AWS_SES_FROM_DEFAULT'),
    config.requireSecret('AWS_SES_HOST'),
    config.requireSecret('AWS_SES_USERNAME'),
    config.requireSecret('AWS_SES_PASSWORD'),
    config.requireSecret('POMELO_SIGNATURE_SECRET_KEY_DIC'),
    config.requireSecret('POMELO_WHITELISTED_IPS'),
    config.requireSecret('POMELO_CLIENT_ID'),
    config.requireSecret('POMELO_SECRET_ID'),
    config.requireSecret('POMELO_AUDIENCE'),
    config.requireSecret('POMELO_AUTH_GRANT_TYPE'),
    config.requireSecret('POMELO_API_URL'),
    config.requireSecret('CURRENCY_CONVERSION_API_KEY'),
    config.requireSecret('CURRENCY_CONVERSION_API_URL'),
    config.requireSecret('POMELO_SFTP_HOST'),
    config.requireSecret('POMELO_SFTP_PORT'),
    config.requireSecret('POMELO_SFTP_USR'),
    config.requireSecret('POMELO_SFTP_PASSPHRASE'),
    config.requireSecret('MONGOATLAS_PROJECT_ID'),
    config.requireSecret('MONGOATLAS_USERNAME'),
    config.requireSecret('MONGOATLAS_PASSWORD'),
  ])
  .apply(
    ([
      DATABASE_URL,
      RABBIT_MQ_HOST,
      RABBIT_MQ_USERNAME,
      RABBIT_MQ_PASSWORD,
      REDIS_HOST,
      REDIS_USERNAME,
      REDIS_PASSWORD,
      AUTH_SECRET,
      AWS_SES_FROM_DEFAULT,
      AWS_SES_HOST,
      AWS_SES_USERNAME,
      AWS_SES_PASSWORD,
      POMELO_SIGNATURE_SECRET_KEY_DIC,
      POMELO_WHITELISTED_IPS,
      POMELO_CLIENT_ID,
      POMELO_SECRET_ID,
      POMELO_AUDIENCE,
      POMELO_AUTH_GRANT_TYPE,
      POMELO_API_URL,
      CURRENCY_CONVERSION_API_KEY,
      CURRENCY_CONVERSION_API_URL,
      POMELO_SFTP_HOST,
      POMELO_SFTP_PORT,
      POMELO_SFTP_USR,
      POMELO_SFTP_PASSPHRASE,
      MONGOATLAS_PROJECT_ID,
      MONGOATLAS_USERNAME,
      MONGOATLAS_PASSWORD,
    ]) => ({
      DATABASE_URL,
      RABBIT_MQ_HOST,
      RABBIT_MQ_USERNAME,
      RABBIT_MQ_PASSWORD,
      REDIS_HOST,
      REDIS_USERNAME,
      REDIS_PASSWORD,
      AUTH_SECRET,
      AWS_SES_FROM_DEFAULT,
      AWS_SES_HOST,
      AWS_SES_USERNAME,
      AWS_SES_PASSWORD,
      POMELO_SIGNATURE_SECRET_KEY_DIC,
      POMELO_WHITELISTED_IPS,
      POMELO_CLIENT_ID,
      POMELO_SECRET_ID,
      POMELO_AUDIENCE,
      POMELO_AUTH_GRANT_TYPE,
      POMELO_API_URL,
      CURRENCY_CONVERSION_API_KEY,
      CURRENCY_CONVERSION_API_URL,
      POMELO_SFTP_HOST,
      POMELO_SFTP_PORT,
      POMELO_SFTP_USR,
      POMELO_SFTP_PASSPHRASE,
      MONGOATLAS_PROJECT_ID,
      MONGOATLAS_USERNAME,
      MONGOATLAS_PASSWORD,
    }),
  );

export const COMPANY_NAME = 'b2crypto';
export const PROJECT_NAME = 'monolith';
export const STACK = config.require('STACK');
export const CREATED_BY = 'Pulumi IaC';
export const ENVIRONMENT = config.require('ENVIRONMENT');
export const PORT = config.require('PORT');
export const APP_NAME = config.require('APP_NAME');
export const GOOGLE_2FA = config.require('GOOGLE_2FA');
export const DATABASE_NAME = config.require('DATABASE_NAME');
export const RABBIT_MQ_PORT = config.require('RABBIT_MQ_PORT');
export const RABBIT_MQ_QUEUE = config.require('RABBIT_MQ_QUEUE');
export const REDIS_PORT = config.require('REDIS_PORT');
export const CACHE_TTL = config.require('CACHE_TTL');
export const CACHE_MAX_ITEMS = config.require('CACHE_MAX_ITEMS');
export const AUTH_MAX_SECONDS_TO_REFRESH = config.require(
  'AUTH_MAX_SECONDS_TO_REFRESH',
);
export const AUTH_EXPIRE_IN = config.require('AUTH_EXPIRE_IN');
export const API_KEY_EMAIL_APP = config.require('API_KEY_EMAIL_APP');
export const URL_API_EMAIL_APP = config.require('URL_API_EMAIL_APP');
export const TESTING = config.require('TESTING');
export const TZ = config.require('TZ');
export const AWS_SES_PORT = config.require('AWS_SES_PORT');
export const DEFAULT_CURRENCY_CONVERSION_COIN = config.require(
  'DEFAULT_CURRENCY_CONVERSION_COIN',
);
export const AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE = config.require(
  'AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE',
);
export const POMELO_WHITELISTED_IPS_CHECK = config.require(
  'POMELO_WHITELISTED_IPS_CHECK',
);
export const VPC_CIDR_BLOCK = config.require('VPC_CIDR_BLOCK');
export const DESIRED_COUNT_TASK = config.require('DESIRED_COUNT_TASK');
export const MAX_CAPACITY_AUTOSCALING = config.require(
  'MAX_CAPACITY_AUTOSCALING',
);
export const MIN_CAPACITY_AUTOSCALING = config.require(
  'MIN_CAPACITY_AUTOSCALING',
);
export const LOGO_URL = config.require('LOGO_URL');
export const SOCIAL_MEDIA_ICONS = config.require('SOCIAL_MEDIA_ICONS');
export const SOCIAL_MEDIA_LINKS = config.require('SOCIAL_MEDIA_LINKS');
export const RABBIT_MQ_INSTANCE_TYPE = config.require(
  'RABBIT_MQ_INSTANCE_TYPE',
);
export const MQ_DEPLOYMENT_MODE = config.require('MQ_DEPLOYMENT_MODE');

export const TESTING_MODE = config.require('TESTING_MODE');

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

export const SUBDOMAIN_PREFIX = config.require('SUBDOMAIN_PREFIX');
