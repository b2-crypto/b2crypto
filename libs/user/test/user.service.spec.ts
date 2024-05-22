import { CommonModule } from '@common/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { RoleModule } from '@role/role';
import { UserServiceMongooseService } from '@user/user';
import { UserDocument } from '@user/user/entities/mongoose/user.schema';
import { userProviders } from '@user/user/providers/user.providers';

describe('UserService', () => {
  let service: UserServiceMongooseService;
  let user: UserDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, ResponseB2CryptoModule, RoleModule],
      providers: [UserServiceMongooseService, ...userProviders],
    }).compile();

    service = module.get<UserServiceMongooseService>(
      UserServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
