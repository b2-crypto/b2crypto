import { Test, TestingModule } from '@nestjs/testing';
import { TransferServiceController } from './transfer-service.controller';
import { TransferServiceService } from './transfer-service.service';
import { BuildersService } from '@builder/builders';
import { AffiliateServiceService } from 'apps/affiliate-service/src/affiliate-service.service';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { TransferUpdateDto } from '@transfer/transfer/dto/transfer.update.dto';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import { ApproveOrRejectDepositDto } from '../../../libs/transfer/src/dto/approve.or.reject.deposit.dto';
import { TransferUpdateFromLatamCashierDto } from '@transfer/transfer/dto/transfer.update.from.latamcashier.dto';
import { BoldTransferRequestDto } from './dto/bold.transfer.request.dto';
import { Response } from 'express';
import { TransferCreateButtonDto } from './dto/transfer.create.button.dto';
import { RmqContext } from '@nestjs/microservices';
import { TransferDocument } from '@transfer/transfer/entities/mongoose/transfer.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('@nestjs/microservices', () => ({
  ...jest.requireActual('@nestjs/microservices'),
  RmqContext: jest.fn(),
}));

describe('TransferServiceController', () => {
  let controller: TransferServiceController;
  let transferService: TransferServiceService;
  let builderService: BuildersService;
  let affiliateService: AffiliateServiceService;

  const mockTransferDocument: TransferDocument = {
    _id: '1',
    numericId: 1,
    name: 'Test Transfer',
    slug: 'test-transfer',
    description: 'Test description',
    amount: 100,
    currency: 'USD',
    operationType: OperationTransactionType.deposit,
    statusPayment: 'pending',
  } as TransferDocument;

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferServiceController],
      providers: [
        {
          provide: TransferServiceService,
          useValue: {
            getAll: jest.fn(),
            getOne: jest.fn(),
            newTransfer: jest.fn(),
            updateTransfer: jest.fn(),
            deleteTransfer: jest.fn(),
            getByLead: jest.fn(),
            updateTransferFromLatamCashier: jest.fn(),
            approveTransfer: jest.fn(),
            rejectTransfer: jest.fn(),
            updateManyTransfer: jest.fn(),
            deleteManyTransfer: jest.fn(),
            getSearchText: jest.fn(),
            updateTransferByIdPayment: jest.fn(),
            checkTransferStatsByQuery: jest.fn(),
          },
        },
        {
          provide: BuildersService,
          useValue: {
            emitTransferEventClient: jest.fn(),
            getPromiseCategoryEventClient: jest.fn(),
            getPromiseCrmEventClient: jest.fn(),
            getPromiseStatusEventClient: jest.fn(),
            getPromiseAccountEventClient: jest.fn(),
            getPromiseStatsEventClient: jest.fn(),
            getPromisePspAccountEventClient: jest.fn(),
            getPromiseAffiliateEventClient: jest.fn(),
          },
        },
        {
          provide: AffiliateServiceService,
          useValue: {
            getAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TransferServiceController>(TransferServiceController);
    transferService = module.get<TransferServiceService>(TransferServiceService);
    builderService = module.get<BuildersService>(BuildersService);
    affiliateService = module.get<AffiliateServiceService>(AffiliateServiceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOneDeposit', () => {
    it('should create a new deposit transfer', async () => {
      const createDto = new TransferCreateDto();
      createDto.amount = 100;
      createDto.currency = 'USD';
      jest.spyOn(transferService, 'newTransfer').mockResolvedValue(mockTransferDocument);
      const result = await controller.createOneDeposit(createDto, { user: { id: '1' } });
      expect(result).toBe(mockTransferDocument);
      expect(createDto.userCreator).toBe('1');
      expect(createDto.operationType).toBe(OperationTransactionType.deposit);
    });
  });

  describe('createOneCredit', () => {
    it('should create a new credit transfer', async () => {
      const createDto = new TransferCreateDto();
      createDto.amount = 100;
      createDto.currency = 'USD';
      jest.spyOn(transferService, 'newTransfer').mockResolvedValue(mockTransferDocument);
      const result = await controller.createOneCredit(createDto, { user: { id: '1' } });
      expect(result).toBe(mockTransferDocument);
      expect(createDto.userCreator).toBe('1');
      expect(createDto.operationType).toBe(OperationTransactionType.credit);
    });
  });

  describe('createOneWithdrawal', () => {
    it('should create a new withdrawal transfer', async () => {
      const createDto = new TransferCreateDto();
      createDto.amount = 100;
      createDto.currency = 'USD';
      jest.spyOn(transferService, 'newTransfer').mockResolvedValue(mockTransferDocument);
      const result = await controller.createOneWithdrawal(createDto, { user: { id: '1' } });
      expect(result).toBe(mockTransferDocument);
      expect(createDto.userCreator).toBe('1');
      expect(createDto.operationType).toBe(OperationTransactionType.withdrawal);
    });
  });

  describe('createOneDebit', () => {
    it('should create a new debit transfer', async () => {
      const createDto = new TransferCreateDto();
      createDto.amount = 100;
      createDto.currency = 'USD';
      jest.spyOn(transferService, 'newTransfer').mockResolvedValue(mockTransferDocument);
      const result = await controller.createOneDebit(createDto, { user: { id: '1' } });
      expect(result).toBe(mockTransferDocument);
      expect(createDto.userCreator).toBe('1');
      expect(createDto.operationType).toBe(OperationTransactionType.debit);
    });
  });

  describe('createOneChargeback', () => {
    it('should create a new chargeback transfer', async () => {
      const createDto = new TransferCreateDto();
      createDto.amount = 100;
      createDto.currency = 'USD';
      jest.spyOn(transferService, 'newTransfer').mockResolvedValue(mockTransferDocument);
      const result = await controller.createOneChargeback(createDto, { user: { id: '1' } });
      expect(result).toBe(mockTransferDocument);
      expect(createDto.userCreator).toBe('1');
      expect(createDto.operationType).toBe(OperationTransactionType.chargeback);
    });
  });
  describe('Message Patterns', () => {
    const mockContext = { getMessage: jest.fn(), getChannelRef: jest.fn(), getPattern: jest.fn() } as unknown as RmqContext;

    describe('findAllEvent', () => {
      it('should handle findAll event', async () => {
        const query = new QuerySearchAnyDto();
        const result = { list: [mockTransferDocument], total: 1 };
        jest.spyOn(transferService, 'getAll').mockResolvedValue(result);
        expect(await controller.findAllEvent(query, mockContext)).toBe(result);
      });
    });

    describe('createOneDepositPaymentLinkEvent', () => {
      it('should create a deposit payment link', async () => {
        const createDto = new TransferCreateButtonDto();
        createDto.amount = '100';
        createDto.currency = 'USD';
        createDto.creator = '1';
        jest.spyOn(affiliateService, 'getAll').mockResolvedValue({ list: [{ account: '123' }], total: 1 });
        jest.spyOn(builderService, 'getPromiseCategoryEventClient').mockResolvedValue({ _id: 'category1' });
        jest.spyOn(transferService, 'newTransfer').mockResolvedValue(mockTransferDocument);
        const result = await controller.createOneDepositPaymentLinkEvent(createDto, mockContext);
        expect(result).toBe(mockTransferDocument);
      });
    });

    describe('createManyEvent', () => {
      it('should throw NotImplementedException', async () => {
        await expect(controller.createManyEvent([], mockContext)).rejects.toThrow('Method not implemented.');
      });
    });

    describe('updateManyEvent', () => {
      it('should throw NotImplementedException', async () => {
        await expect(controller.updateManyEvent([], mockContext)).rejects.toThrow('Method not implemented.');
      });
    });

    describe('deleteManyByIdEvent', () => {
      it('should throw NotImplementedException', async () => {
        await expect(controller.deleteManyByIdEvent([], mockContext)).rejects.toThrow('Method not implemented.');
      });
    });

    describe('deleteOneByIdEvent', () => {
      it('should throw NotImplementedException', async () => {
        await expect(controller.deleteOneByIdEvent('1', mockContext)).rejects.toThrow('Method not implemented.');
      });
    });

    describe('findOneByIdEvent', () => {
      it('should find one transfer by id', async () => {
        jest.spyOn(transferService, 'getOne').mockResolvedValue(mockTransferDocument);
        expect(await controller.findOneByIdEvent('1', mockContext)).toBe(mockTransferDocument);
      });
    });

    describe('findOneByIdToCrmSendEvent', () => {
      it('should find one transfer by id for CRM send', async () => {
        jest.spyOn(transferService, 'getAll').mockResolvedValue({ list: [mockTransferDocument], total: 1 });
        expect(await controller.findOneByIdToCrmSendEvent('1', mockContext)).toBe(mockTransferDocument);
      });
    });

    describe('findByLead', () => {
      it('should find transfers by lead', async () => {
        const result = [mockTransferDocument];
        jest.spyOn(transferService, 'getByLead').mockResolvedValue(result);
        expect(await controller.findByLead('leadId', mockContext)).toBe(result);
      });
    });

    describe('createOneEvent', () => {
      it('should create one transfer', async () => {
        const createDto = new TransferCreateDto();
        jest.spyOn(transferService, 'newTransfer').mockResolvedValue(mockTransferDocument);
        expect(await controller.createOneEvent(createDto, mockContext)).toBe(mockTransferDocument);
      });
    });

    describe('updateOneEvent', () => {
      it('should update one transfer', async () => {
        const updateDto = new TransferUpdateDto();
        jest.spyOn(transferService, 'updateTransfer').mockResolvedValue(mockTransferDocument);
        expect(await controller.updateOneEvent(updateDto, mockContext)).toBe(mockTransferDocument);
      });
    });
  });

  // Event Patterns tests
  describe('Event Patterns', () => {
    const mockContext = { getMessage: jest.fn(), getChannelRef: jest.fn(), getPattern: jest.fn() } as unknown as RmqContext;

    describe('createOneWebhook', () => {
      it('should create a transfer from webhook', async () => {
        const webhookDto = {
          integration: 'testIntegration',
          status: 'testStatus',
          amount: 100,
          currency: 'USD',
          description: 'Test description',
          operationType: OperationTransactionType.deposit,
        };
        jest.spyOn(builderService, 'getPromiseCrmEventClient').mockResolvedValue({ id: 'crm1' });
        jest.spyOn(builderService, 'getPromiseStatusEventClient').mockResolvedValue({ id: 'status1' });
        jest.spyOn(builderService, 'getPromiseAccountEventClient').mockResolvedValue({ id: 'account1', owner: 'user1' });
        jest.spyOn(builderService, 'getPromiseCategoryEventClient').mockResolvedValue({ id: 'category1' });
        jest.spyOn(transferService, 'newTransfer').mockResolvedValue(mockTransferDocument);
        await controller.createOneWebhook(webhookDto, mockContext);
        expect(transferService.newTransfer).toHaveBeenCalled();
      });
    });

    describe('createOneMigration', () => {
      it('should create a transfer from migration', async () => {
        const migrationDto = {
          integration: 'testIntegration',
          status: 'testStatus',
          movement: 'testMovement',
          account: { id: 'account1', owner: 'user1', amount: 100 },
        };
        jest.spyOn(builderService, 'getPromiseCrmEventClient').mockResolvedValue({ id: 'crm1' });
        jest.spyOn(builderService, 'getPromiseStatusEventClient').mockResolvedValue({ id: 'status1' });
        jest.spyOn(builderService, 'getPromiseCategoryEventClient').mockResolvedValue({ id: 'category1' });
        jest.spyOn(transferService, 'newTransfer').mockResolvedValue(mockTransferDocument);
        await controller.createOneMigration(migrationDto, mockContext);
        expect(transferService.newTransfer).toHaveBeenCalled();
      });
    });

    describe('checkAllLeadsForPspAccountStats', () => {
      it('should check all leads for PSP account stats', async () => {
        jest.spyOn(builderService, 'getPromiseStatsEventClient').mockResolvedValue({ list: [], total: 0 });
        jest.spyOn(builderService, 'getPromisePspAccountEventClient').mockResolvedValue({});
        jest.spyOn(transferService, 'getAll').mockResolvedValue({
          list: [mockTransferDocument],
          total: 1,
          currentPage: 1,
          nextPage: 1,
          lastPage: 1,
        });
        await controller.checkAllLeadsForPspAccountStats('pspAccountId', mockContext);
        expect(builderService.getPromiseStatsEventClient).toHaveBeenCalledTimes(3);
        expect(builderService.getPromisePspAccountEventClient).toHaveBeenCalledTimes(1);
      });
    });

    describe('checkTransferStatsByQuery', () => {
      it('should check transfer stats by query', async () => {
        const query = new QuerySearchAnyDto();
        await controller.checkTransferStatsByQuery(query, mockContext);
      });
    });
  });

  describe('Private methods (tested indirectly)', () => {
    describe('filterFromUserPermissions', () => {
      it('should filter transfers based on user permissions', async () => {
        const query = new QuerySearchAnyDto();
        const mockReq = {
          user: {
            id: '1',
            permissions: [
              { action: 'read', scope: { resourceName: 'brand', resourceId: 'brand1' } },
            ],
          },
        };
        jest.spyOn(transferService, 'getAll').mockResolvedValue({ list: [mockTransferDocument], total: 1 });
        await controller.findAll(query, mockReq);
        expect(transferService.getAll).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
            brand: expect.objectContaining({ $in: ['brand1'] }),
          }),
        }));
      });
    });

    describe('getDepositLinkCategory', () => {
      it('should get deposit link category', async () => {
        const createDto = new TransferCreateButtonDto();
        createDto.amount = '100';
        createDto.currency = 'USD';
        createDto.creator = '1';
        jest.spyOn(affiliateService, 'getAll').mockResolvedValue({ list: [{ account: '123' }], total: 1 });
        jest.spyOn(builderService, 'getPromiseCategoryEventClient').mockResolvedValue({ _id: 'category1' });
        jest.spyOn(transferService, 'newTransfer').mockResolvedValue(mockTransferDocument);
        await controller.createOneDepositPaymentLinkEvent(createDto, mockContext);
        expect(builderService.getPromiseCategoryEventClient).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            slug: 'deposit-link',
            type: expect.anything(),
          })
        );
      });
    });
  });
});