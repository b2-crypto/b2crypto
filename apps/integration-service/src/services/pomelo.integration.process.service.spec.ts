import { Test, TestingModule } from '@nestjs/testing';
import { PomeloIntegrationProcessService } from './pomelo.integration.process.service';
import { CommonModule } from '@common/common';
import { IntegrationModule } from '@integration/integration';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '@auth/auth';
import { UserModule } from '@user/user';
import { AccountModule } from '@account/account/account.module';
import { BuildersModule, BuildersService } from '@builder/builders';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { FiatIntegrationClient } from '../clients/fiat.integration.client';
import { CacheModule } from '@nestjs/cache-manager';
import { PomeloProcessConstants } from '@common/common/utils/pomelo.integration.process.constants';
import { ConfigModule } from '@nestjs/config';
import configuration from '@config/config';

describe('PomeloIntegrationProcessService', () => {
  let processService: PomeloIntegrationProcessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({}),
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        AuthModule,
        UserModule,
        HttpModule,
        CommonModule,
        AccountModule,
        BuildersModule,
        IntegrationModule,
      ],
      providers: [
        PomeloIntegrationProcessService,
        PomeloCache,
        FiatIntegrationClient,
        //BuildersService,
        PomeloProcessConstants,
      ],
    }).compile();

    processService = module.get<PomeloIntegrationProcessService>(
      PomeloIntegrationProcessService,
    );
  });

  describe('Test Pomelo Process', () => {
    it('should inject process service', () => {
      expect(processService).toBeDefined();
    });
  });
});
