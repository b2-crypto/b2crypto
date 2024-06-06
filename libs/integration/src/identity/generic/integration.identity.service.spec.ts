import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationIdentityService } from './integration.identity.service';

describe('LeverateIntegrationService', () => {
  let service: IntegrationIdentityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntegrationIdentityService],
    }).compile();

    service = module.get<IntegrationIdentityService>(
      IntegrationIdentityService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
