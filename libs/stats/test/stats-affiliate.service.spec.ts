import { Test, TestingModule } from '@nestjs/testing';
import { StatsDateAffiliateServiceMongooseService } from '@stats/stats';
import { StatsDateAffiliateDocument } from '@stats/stats/entities/mongoose/stats.date.affiliate.schema';

describe('StatsDateAffiliateService', () => {
  let service: StatsDateAffiliateServiceMongooseService;
  let stats: StatsDateAffiliateDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatsDateAffiliateServiceMongooseService],
    }).compile();

    service = module.get<StatsDateAffiliateServiceMongooseService>(
      StatsDateAffiliateServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
