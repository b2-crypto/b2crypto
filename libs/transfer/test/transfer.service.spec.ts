import { Test, TestingModule } from '@nestjs/testing';
import { TransferDocument } from '@transfer/transfer/entities/mongoose/transfer.schema';
import { transferProviders } from '@transfer/transfer/providers/transfer.providers';
import { TransferServiceMongooseService } from '@transfer/transfer/transfer-service-mongoose.service';

describe('TransferService', () => {
  let service: TransferServiceMongooseService;
  let transfer: TransferDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransferServiceMongooseService, ...transferProviders],
    }).compile();

    service = module.get<TransferServiceMongooseService>(
      TransferServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
