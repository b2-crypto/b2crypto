import { Test, TestingModule } from '@nestjs/testing';
import { TrafficDocument } from '@traffic/traffic/entities/mongoose/traffic.schema';
import { trafficProviders } from '@traffic/traffic/providers/traffic.providers';
import { TrafficServiceMongooseService } from '@traffic/traffic/traffic-service-mongoose.service';

describe('TrafficService', () => {
  let service: TrafficServiceMongooseService;
  let traffic: TrafficDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrafficServiceMongooseService, ...trafficProviders],
    }).compile();

    service = module.get<TrafficServiceMongooseService>(
      TrafficServiceMongooseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
