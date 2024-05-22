import { MessageDocument } from '@message/message/entities/mongoose/message.schema';
import { MessageServiceMongooseService } from '@message/message/message-service-mongoose.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('MessageService', () => {
  let service: MessageServiceMongooseService;
  let message: MessageDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageServiceMongooseService],
    }).compile();

    service = module.get<MessageServiceMongooseService>(
      MessageServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
