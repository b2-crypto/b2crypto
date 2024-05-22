import { Test, TestingModule } from '@nestjs/testing';
import { ResponseB2CryptoService } from '@response-b2crypto/response-b2crypto';

describe('ResponseB2CryptoService', () => {
  let service: ResponseB2CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseB2CryptoService],
    }).compile();

    service = module.get<ResponseB2CryptoService>(ResponseB2CryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
