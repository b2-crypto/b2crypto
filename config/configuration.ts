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
  DATABASE_REDIS_HOST:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.DATABASE_REDIS_HOST
      : 'localhost',
  DATABASE_REDIS_USERNAME:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.DATABASE_REDIS_USERNAME
      : 'b2crypto',
  DATABASE_REDIS_PASSWORD:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.DATABASE_REDIS_PASSWORD
      : null,
  DATABASE_REDIS_PORT:
    process.env.ENVIRONMENT == EnvironmentEnum.prod
      ? process.env.DATABASE_REDIS_PORT
      : 6379,
  RABBIT_MQ_HOST: process.env.RABBIT_MQ_HOST ?? 'localhost',
  RABBIT_MQ_PORT: process.env.RABBIT_MQ_PORT ?? '5672',
  RABBIT_MQ_QUEUE: process.env.RABBIT_MQ_QUEUE ?? 'DEV',
  RABBIT_MQ_USERNAME: process.env.RABBIT_MQ_USERNAME ?? 'admin',
  RABBIT_MQ_PASSWORD: process.env.RABBIT_MQ_PASSWORD ?? 'admin',
  TESTING: process.env.TESTING ?? true,
  TZ: process.env.TZ,
  AWS_SES_FROM_DEFAULT: process.env.AWS_SES_FROM_DEFAULT,
  AWS_SES_HOST: process.env.AWS_SES_HOST,
  AWS_SES_PORT: process.env.AWS_SES_PORT,
  AWS_SES_SMTP_USERNAME: process.env.AWS_SES_SMTP_USERNAME,
  AWS_SES_SMTP_PASSWORD: process.env.AWS_SES_SMTP_PASSWORD,
}));
