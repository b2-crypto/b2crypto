import { Test, TestingModule } from '@nestjs/testing';
import { PersonDocument } from '@person/person/entities/mongoose/person.schema';
import { PersonServiceMongooseService } from '@person/person/person-service-mongoose.service';

describe('PersonService', () => {
  let service: PersonServiceMongooseService;
  let person: PersonDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonServiceMongooseService],
    }).compile();

    service = module.get<PersonServiceMongooseService>(
      PersonServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
