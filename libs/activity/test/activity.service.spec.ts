import { ActivityServiceMongooseService } from '@activity/activity/activity-service-mongoose.service';
import { ActivityDocument } from '@activity/activity/entities/mongoose/activity.schema';
import { CommonModule } from '@common/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('ActivityService', () => {
  let service: ActivityServiceMongooseService;
  let activity: ActivityDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, ResponseB2CryptoModule],
      providers: [ActivityServiceMongooseService],
    })
      .useMocker((token) => {
        const results = ['test1', 'test2'];
        if (token === ActivityServiceMongooseService) {
          return { findAll: jest.fn().mockResolvedValue(results) };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = module.get<ActivityServiceMongooseService>(
      ActivityServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
