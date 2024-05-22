import { Test, TestingModule } from '@nestjs/testing';
import { PspAccountDocument } from '@psp-account/psp-account/entities/mongoose/psp-account.schema';
import { PspAccountServiceMongooseService } from '@psp-account/psp-account/psp-account-service-mongoose.service';

describe('PspAccountService', () => {
  let service: PspAccountServiceMongooseService;
  let pspaccount: PspAccountDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PspAccountServiceMongooseService],
    }).compile();

    service = module.get<PspAccountServiceMongooseService>(
      PspAccountServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
