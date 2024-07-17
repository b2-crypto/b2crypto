import { Test, TestingModule } from '@nestjs/testing';
import { PomeloIntegrationServiceController } from './pomelo.integration-service.controller';
import { IntegrationServiceService } from './integration-service.service';

describe('IntegrationServiceController', () => {
  let integrationServiceController: PomeloIntegrationServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PomeloIntegrationServiceController],
      providers: [IntegrationServiceService],
    }).compile();

    integrationServiceController = app.get<PomeloIntegrationServiceController>(
      PomeloIntegrationServiceController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {});
  });
});
