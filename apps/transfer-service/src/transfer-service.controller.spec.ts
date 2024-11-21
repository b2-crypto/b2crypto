import { Test, TestingModule } from '@nestjs/testing';
import { TransferServiceController } from './transfer-service.controller';
import { TransferServiceService } from './transfer-service.service';
import { BuildersService } from '@builder/builders';
import { AffiliateServiceService } from 'apps/affiliate-service/src/affiliate-service.service';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import { RmqContext } from '@nestjs/microservices';
import { TransferDocument } from '@transfer/transfer/entities/mongoose/transfer.schema';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { BoldTransferRequestDto } from './dto/bold.transfer.request.dto';
import { Account } from '@account/account/entities/mongoose/account.schema';

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

  const mockGetAllResponse: ResponsePaginator<TransferDocument> = {
    list: [mockTransferDocument],
    currentPage: 1,
    nextPage: 2,
    prevPage: 0,
    lastPage: 2,
    firstPage: 1,
    elementsPerPage: 10,
    totalElements: 1,
    order: ['asc'],
  };

  const mockContext = {} as RmqContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferServiceController],
      providers: [
        {
          provide: TransferServiceService,
          useValue: {
            getAll: jest.fn().mockResolvedValue(mockGetAllResponse),
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
            handleBoldWebhook: jest.fn(),
            newManyTransfer: jest.fn(),
            sendToCrm: jest.fn(),
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
            getAll: jest.fn().mockResolvedValue({
              list: [{ account: { id: '123' } as unknown as Account }],
              totalElements: 1,
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<TransferServiceController>(
      TransferServiceController,
    );
    transferService = module.get<TransferServiceService>(
      TransferServiceService,
    );
    builderService = module.get<BuildersService>(BuildersService);
    affiliateService = module.get<AffiliateServiceService>(
      AffiliateServiceService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('boldWebhook', () => {
    it('should call handleBoldWebhook', async () => {
      const mockBoldTransferRequest = new BoldTransferRequestDto();
      jest
        .spyOn(transferService, 'handleBoldWebhook')
        .mockResolvedValue({} as any);

      await controller.boldWebhook(mockBoldTransferRequest);

      expect(transferService.handleBoldWebhook).toHaveBeenCalledWith(
        mockBoldTransferRequest,
      );
    });
  });

  describe('searchText', () => {
    it('should call getSearchText', async () => {
      const mockQuery = new QuerySearchAnyDto();
      jest.spyOn(transferService, 'getSearchText').mockResolvedValue({} as any);

      await controller.searchText(mockQuery);

      expect(transferService.getSearchText).toHaveBeenCalledWith(mockQuery);
    });
  });

  describe('findAll', () => {
    it('should call getAll', async () => {
      const mockQuery = new QuerySearchAnyDto();

      await controller.findAll(mockQuery);

      expect(transferService.getAll).toHaveBeenCalledWith(mockQuery);
    });
  });
});
