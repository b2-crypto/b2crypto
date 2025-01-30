import { ConfigModule, ConfigService } from '@nestjs/config';
import * as mongoose from 'mongoose';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { EnvironmentEnum } from '../enums/environment.enum';

export const databaseProviders = [
  {
    provide: 'MONGOOSE_CONNECTION',
    useFactory: async (
      configService: ConfigService,
      logger: Logger,
    ): Promise<typeof mongoose> => {
      const dbName = configService.get('DATABASE_NAME');
      const dbUrl = configService.get('DATABASE_URL');

      try {
        const connection = await mongoose.connect(dbUrl, {
          w: 'majority',
          retryWrites: true,
          dbName: dbName,
          keepAlive: true,
          keepAliveInitialDelay: 300000,
        });
        if (configService.get('ENVIRONMENT') !== EnvironmentEnum.prod) {
          logger.debug(`Database "${dbName}" connect to:`, dbUrl);
        }

        return connection;
      } catch (error) {
        logger.error(error.message, error);
        return error;
      }
    },
    imports: [ConfigModule],
    inject: [ConfigService, WINSTON_MODULE_PROVIDER],
  },
];
