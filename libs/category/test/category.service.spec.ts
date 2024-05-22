import { CategoryServiceMongooseService } from '@category/category';
import { CategoryDocument } from '@category/category/entities/mongoose/category.schema';
import { Test, TestingModule } from '@nestjs/testing';

describe('CategoryService', () => {
  let service: CategoryServiceMongooseService;
  let category: CategoryDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryServiceMongooseService],
    }).compile();

    service = module.get<CategoryServiceMongooseService>(
      CategoryServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
