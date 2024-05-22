import { Test, TestingModule } from '@nestjs/testing';
import { StatusDocument } from '@status/status/entities/mongoose/status.schema';
import { StatusServiceMongooseService } from '@status/status/status-service-mongoose.service';

describe('StatusService', () => {
  let service: StatusServiceMongooseService;
  let status: StatusDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatusServiceMongooseService],
    }).compile();

    service = module.get<StatusServiceMongooseService>(
      StatusServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
