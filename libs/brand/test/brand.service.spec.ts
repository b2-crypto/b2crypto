import { BrandServiceMongooseService } from '@brand/brand/brand-service-mongoose.service';
import { BrandDocument } from '@brand/brand/entities/mongoose/brand.schema';
import { Test, TestingModule } from '@nestjs/testing';

describe('BrandService', () => {
  let service: BrandServiceMongooseService;
  let brand: BrandDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrandServiceMongooseService],
    }).compile();

    service = module.get<BrandServiceMongooseService>(
      BrandServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
