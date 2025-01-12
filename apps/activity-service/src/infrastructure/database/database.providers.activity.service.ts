import DatabaseConnectionEnum from '@common/common/enums/DatabaseConnectionEnum';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as mongoose from 'mongoose';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export const databaseProviders = [
  {
    provide: `MONGOOSE_CONNECTION${DatabaseConnectionEnum.Activity}`,
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

        logger.info('Database activity connection open');

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
