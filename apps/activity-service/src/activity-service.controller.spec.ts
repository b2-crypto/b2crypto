import { Test, TestingModule } from '@nestjs/testing';
import { ActivityServiceController } from './activity-service.controller';
import { ActivityServiceService } from './activity-service.service';
import { BuildersModule } from '@builder/builders';
import { ActivityModule } from '@activity/activity';
import { CommonModule } from '@common/common';
import { QueueAdminModule } from '@common/common/queue-admin-providers/queue.admin.provider.module';
import configuration from '@config/config';
import { ConfigModule } from '@nestjs/config';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';

describe('ActivityServiceController', () => {
  let activityServiceController: ActivityServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        CommonModule,
        BuildersModule,
        ActivityModule,
        QueueAdminModule,
        ResponseB2CryptoModule,
      ],
      controllers: [ActivityServiceController],
      providers: [ActivityServiceService],
    }).compile();

    activityServiceController = app.get<ActivityServiceController>(
      ActivityServiceController,
    );
  });

  describe('root', () => {
    it('should be defined!"', () => {
      expect(activityServiceController).toBeDefined();
    });
  });
});
