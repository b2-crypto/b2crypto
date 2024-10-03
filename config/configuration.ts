import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  AUTH_APP_NAME: process.env.AUTH_APP_NAME || 'MOISES',
  APP_NAME: process.env.APP_NAME || 'B2Crypto',
  GOOGLE_2FA:
    process.env.GOOGLE_2FA === 'true'
      ? true
      : process.env.GOOGLE_2FA === 'false'
      ? false
      : false,
  MAX_SECOND_TO_REFRESH: process.env.MAX_SECOND_TO_REFRESH || 60,
  ENVIRONMENT: (process.env.ENVIRONMENT || EnvironmentEnum.prod).toLowerCase(),
  AUTH_SECRET:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.AUTH_SECRET
      : 'B2CRYPTO 2',
  AUTH_EXPIRE_IN:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.AUTH_EXPIRE_IN || '60m'
      : '8h',
  AUTH_MAX_SECONDS_TO_REFRESH:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.AUTH_MAX_SECONDS_TO_REFRESH || '60'
      : '60',
  PORT:
    process.env.ENVIRONMENT == EnvironmentEnum.prod ? process.env.PORT : 3000,
  DATABASE_NAME:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.DATABASE_NAME
      : 'b2crypto',
  DATABASE_URL:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.DATABASE_URL
      : 'mongodb://localhost:27017/b2crypto',
  REDIS_HOST:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.REDIS_HOST
      : 'localhost',
  REDIS_USERNAME:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.REDIS_USERNAME
      : 'b2crypto',
  REDIS_PASSWORD:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.REDIS_PASSWORD
      : null,
  REDIS_PORT:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.REDIS_PORT
      : 6379,
  CACHE_TTL:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.CACHE_TTL
      : 10,
  CACHE_MAX_ITEMS:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.CACHE_MAX_ITEMS
      : 5,
  RABBIT_MQ_HOST: process.env.RABBIT_MQ_HOST ?? 'localhost',
  RABBIT_MQ_PORT: process.env.RABBIT_MQ_PORT ?? '5672',
  RABBIT_MQ_QUEUE: process.env.RABBIT_MQ_QUEUE ?? 'DEV',
  RABBIT_MQ_USERNAME: process.env.RABBIT_MQ_USERNAME ?? 'admin',
  RABBIT_MQ_PASSWORD: process.env.RABBIT_MQ_PASSWORD ?? 'admin',
  TESTING: process.env.TESTING ?? true,
  TZ: process.env.TZ,
  AWS_SES_HOST: process.env.AWS_SES_HOST,
  AWS_SES_PORT: process.env.AWS_SES_PORT,
  AWS_SES_USERNAME: process.env.AWS_SES_USERNAME,
  AWS_SES_PASSWORD: process.env.AWS_SES_PASSWORD,
  AWS_SES_FROM_DEFAULT: process.env.AWS_SES_FROM_DEFAULT,
  DEFAULT_CURRENCY_CONVERSION_COIN:
    process.env.DEFAULT_CURRENCY_CONVERSION_COIN ?? 'USD',
  AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE:
    process.env.AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE ?? 0.1,
  POMELO_SIGNATURE_SECRET_KEY_DIC: process.env.POMELO_SIGNATURE_SECRET_KEY_DIC,
  POMELO_WHITELISTED_IPS_CHECK: process.env.POMELO_WHITELISTED_IPS_CHECK,
  POMELO_WHITELISTED_IPS: process.env.POMELO_WHITELISTED_IPS,
  POMELO_CLIENT_ID: process.env.POMELO_CLIENT_ID,
  POMELO_SECRET_ID: process.env.POMELO_SECRET_ID,
  POMELO_AUDIENCE: process.env.POMELO_AUDIENCE,
  POMELO_AUTH_GRANT_TYPE: process.env.POMELO_AUTH_GRANT_TYPE,
  POMELO_API_URL: process.env.POMELO_API_URL,
  CURRENCY_CONVERSION_API_KEY: process.env.CURRENCY_CONVERSION_API_KEY,
  CURRENCY_CONVERSION_API_URL: process.env.CURRENCY_CONVERSION_API_URL,
  POMELO_SFTP_HOST: process.env.POMELO_SFTP_HOST,
  POMELO_SFTP_PORT: process.env.POMELO_SFTP_PORT,
  POMELO_SFTP_USR: process.env.POMELO_SFTP_USR,
  POMELO_SFTP_PASSPHRASE: process.env.POMELO_SFTP_PASSPHRASE,
  LOGO_URL: process.env.LOGO_URL,
  SOCIAL_MEDIA_ICONS: process.env.SOCIAL_MEDIA_ICONS,
  SOCIAL_MEDIA_LINKS: process.env.SOCIAL_MEDIA_LINKS,

}));
