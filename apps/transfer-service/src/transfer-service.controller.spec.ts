import { BuildersModule } from '@builder/builders';
import { CategoryModule } from '@category/category';
import configuration from '@config/config';
import { CrmModule } from '@crm/crm';
import { LeadModule } from '@lead/lead';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PspAccountModule } from '@psp-account/psp-account';
import { StatusModule } from '@status/status';
import { TransferModule } from '@transfer/transfer';
import { TransferServiceController } from './transfer-service.controller';
import { TransferServiceService } from './transfer-service.service';

describe('TransferServiceController', () => {
  let transferServiceController: TransferServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        CrmModule,
        LeadModule,
        StatusModule,
        TransferModule,
        CategoryModule,
        BuildersModule,
        PspAccountModule,
      ],
      controllers: [TransferServiceController],
      providers: [TransferServiceService],
    }).compile();

    transferServiceController = app.get<TransferServiceController>(
      TransferServiceController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', async () => {
      expect(await transferServiceController.findAll({})).toBe('Hello World!');
    });
  });
});
