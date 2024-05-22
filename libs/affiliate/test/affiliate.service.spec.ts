import { AffiliateServiceMongooseService } from '@affiliate/affiliate/affiliate-service-mongoose.service';
import { AffiliateDocument } from '@affiliate/affiliate/infrastructure/mongoose/affiliate.schema';
import { Test, TestingModule } from '@nestjs/testing';

describe('AffiliateService', () => {
  let service: AffiliateServiceMongooseService;
  let affiliate: AffiliateDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AffiliateServiceMongooseService],
    }).compile();

    service = module.get<AffiliateServiceMongooseService>(
      AffiliateServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
