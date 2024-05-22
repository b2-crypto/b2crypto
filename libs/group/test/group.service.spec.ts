import { GroupDocument } from '@group/group/entities/mongoose/group.schema';
import { Test, TestingModule } from '@nestjs/testing';
import { GroupServiceMongooseService } from '../src/group-service-mongoose.service';

describe('GroupService', () => {
  let service: GroupServiceMongooseService;
  let group: GroupDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupServiceMongooseService],
    }).compile();

    service = module.get<GroupServiceMongooseService>(
      GroupServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
