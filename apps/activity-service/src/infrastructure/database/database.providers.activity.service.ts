import DatabaseConnectionEnum from '@common/common/enums/DatabaseConnectionEnum';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as mongoose from 'mongoose';

export const databaseProviders = [
  {
    provide: `MONGOOSE_CONNECTION${DatabaseConnectionEnum.Activity}`,
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

        console.log('Database activity connection open');

        return connection;
      } catch (error) {
        console.error(error);
        return error;
      }
    },
    imports: [ConfigModule],
    inject: [ConfigService],
  },
];
