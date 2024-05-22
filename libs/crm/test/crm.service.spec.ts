import { CrmServiceMongooseService } from '@crm/crm/crm-service-mongoose.service';
import { CrmDocument } from '@crm/crm/entities/mongoose/crm.schema';
import { Test, TestingModule } from '@nestjs/testing';

describe('CrmService', () => {
  let service: CrmServiceMongooseService;
  let crm: CrmDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrmServiceMongooseService],
    }).compile();

    service = module.get<CrmServiceMongooseService>(CrmServiceMongooseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
