import { AffiliateModule } from '@affiliate/affiliate';
import { BuildersModule } from '@builder/builders';
import { Test, TestingModule } from '@nestjs/testing';
import { AffiliateServiceController } from './affiliate-service.controller';
import { AffiliateServiceService } from './affiliate-service.service';

describe('AffiliateServiceController', () => {
  let affiliate;
  let affiliateServiceController: AffiliateServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [BuildersModule, AffiliateModule],
      controllers: [AffiliateServiceController],
      providers: [AffiliateServiceService],
    }).compile();

    affiliateServiceController = app.get<AffiliateServiceController>(
      AffiliateServiceController,
    );
  });

  describe('root', () => {
    it('should be defined!"', () => {
      expect(affiliateServiceController).toBeDefined();
    });
  });
});
