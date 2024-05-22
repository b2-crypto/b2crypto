import { Test, TestingModule } from '@nestjs/testing';
import { RoleDocument } from '@role/role/entities/mongoose/role.schema';
import { RoleServiceMongooseService } from '@role/role/role-service-mongoose.service';

describe('RoleService', () => {
  let service: RoleServiceMongooseService;
  let role: RoleDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleServiceMongooseService],
    }).compile();

    service = module.get<RoleServiceMongooseService>(
      RoleServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
