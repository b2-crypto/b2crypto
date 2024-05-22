import { Test, TestingModule } from '@nestjs/testing';
import { PspDocument } from '@psp/psp/entities/mongoose/psp.schema';
import { PspServiceMongooseService } from '@psp/psp/psp-service-mongoose.service';

describe('PspService', () => {
  let service: PspServiceMongooseService;
  let psp: PspDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PspServiceMongooseService],
    }).compile();

    service = module.get<PspServiceMongooseService>(PspServiceMongooseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
