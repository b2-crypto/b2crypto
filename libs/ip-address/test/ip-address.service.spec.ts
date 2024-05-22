import { IpAddressDocument } from '@ip-address/ip-address/entities/mongoose/ip-address.schema';
import { IpAddressServiceMongooseService } from '@ip-address/ip-address/ip-address-service-mongoose.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('IpAddressService', () => {
  let service: IpAddressServiceMongooseService;
  let ipAddress: IpAddressDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IpAddressServiceMongooseService],
    }).compile();

    service = module.get<IpAddressServiceMongooseService>(
      IpAddressServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
