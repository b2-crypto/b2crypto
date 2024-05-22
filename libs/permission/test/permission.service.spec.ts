import { Test, TestingModule } from '@nestjs/testing';
import { PermissionDocument } from '@permission/permission/entities/mongoose/permission.schema';
import { PermissionServiceMongooseService } from '@permission/permission/permission-service-mongoose.service';

describe('PermissionService', () => {
  let service: PermissionServiceMongooseService;
  let permission: PermissionDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionServiceMongooseService],
    }).compile();

    service = module.get<PermissionServiceMongooseService>(
      PermissionServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
