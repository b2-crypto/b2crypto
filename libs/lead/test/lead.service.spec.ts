import { LeadDocument } from '@lead/lead/entities/mongoose/lead.schema';
import { LeadServiceMongooseService } from '@lead/lead/lead-service-mongoose.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('LeadService', () => {
  let service: LeadServiceMongooseService;
  let lead: LeadDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadServiceMongooseService],
    }).compile();

    service = module.get<LeadServiceMongooseService>(
      LeadServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
