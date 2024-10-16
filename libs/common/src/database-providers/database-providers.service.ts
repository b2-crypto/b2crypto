import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as mongoose from 'mongoose';
import { EnvironmentEnum } from '../enums/environment.enum';

export const databaseProviders = [
  {
    provide: 'MONGOOSE_CONNECTION',
    useFactory: async (
      configService: ConfigService,
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
          Logger.log(dbUrl, `Database "${dbName}" connect to:`);
        }

        return connection;
      } catch (error) {
        Logger.error(error);
        return error;
      }
    },
    imports: [ConfigModule],
    inject: [ConfigService],
  },
];
