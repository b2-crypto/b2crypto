import { FileDocument } from '@file/file/entities/mongoose/file.schema';
import { FileServiceMongooseService } from '@file/file/file-service-mongoose.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('FileService', () => {
  let service: FileServiceMongooseService;
  let file: FileDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileServiceMongooseService],
    }).compile();

    service = module.get<FileServiceMongooseService>(
      FileServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
