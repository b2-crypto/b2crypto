import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { AccountServiceMongooseService } from '@account/account/account-service-mongoose.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('AccountService', () => {
  let service: AccountServiceMongooseService;
  let account: AccountDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountServiceMongooseService],
    }).compile();

    service = module.get<AccountServiceMongooseService>(
      AccountServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
