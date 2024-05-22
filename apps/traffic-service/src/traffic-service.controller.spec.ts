import { AffiliateModule } from '@affiliate/affiliate';
import { BuildersModule } from '@builder/builders';
import { Test, TestingModule } from '@nestjs/testing';
import { TrafficModule } from '@traffic/traffic';
import { TrafficServiceController } from './traffic-service.controller';
import { TrafficServiceService } from './traffic-service.service';
import { ConfigModule } from '@nestjs/config';
import configuration from '@config/config';

describe('TrafficServiceController', () => {
  let trafficServiceController: TrafficServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        AffiliateModule,
        TrafficModule,
        BuildersModule,
      ],
      controllers: [TrafficServiceController],
      providers: [TrafficServiceService],
    }).compile();

    trafficServiceController = app.get<TrafficServiceController>(
      TrafficServiceController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(trafficServiceController.findAll({})).toBe('Hello World!');
    });
  });
});
