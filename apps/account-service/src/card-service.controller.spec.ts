import { Test, TestingModule } from '@nestjs/testing';
import { CardIntegrationService } from './card-integration-service';
import { CardTransactionService } from './Card/CardTransactionService';
import { CardShippingService } from './Card/CardShippingService';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigCardActivateDto } from '@account/account/dto/config.card.activate.dto';
import { CardCreateDto } from '@account/account/dto/card.create.dto';
import { CardDepositCreateDto } from '@account/account/dto/card-deposit.create.dto';
import { CardController } from './card-service.controller';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import {
  Account,
  AccountDocument,
} from '@account/account/entities/mongoose/account.schema';
import { User } from '@user/user/entities/mongoose/user.schema';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import { ShippingResult } from '@integration/integration/card/generic/interface/shipping-result.interface';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import mongoose from 'mongoose';

describe('CardController', () => {
  let controller: CardController;
  let cardIntegrationServiceMock: jest.Mocked<CardIntegrationService>;
  let cardTransactionServiceMock: jest.Mocked<CardTransactionService>;
  let cardShippingServiceMock: jest.Mocked<CardShippingService>;

  const mockUserId = new mongoose.Types.ObjectId();

  const mockUser: Partial<User> = {
    _id: mockUserId as unknown as mongoose.Schema.Types.ObjectId,
    id: mockUserId as unknown as mongoose.Schema.Types.ObjectId,
    email: 'test@example.com',
    searchText: 'test',
    name: 'Test User',
    slugEmail: 'test',
  };

  const mockAccount: Partial<Account> = {
    _id: new mongoose.Types.ObjectId(),
    type: TypesAccountEnum.CARD,
    owner: mockUserId as any,
    searchText: 'test card',
    name: 'Test Card',
    docId: '123',
    pin: '1234',
    currency: CurrencyCodeB2cryptoEnum.USDT,
    currencyCustodial: CurrencyCodeB2cryptoEnum.USDT,
    amount: 0,
    amountCustodial: 0,
    statusText: StatusAccountEnum.UNLOCK,
    showToOwner: true,
  };

  beforeEach(async () => {
    cardIntegrationServiceMock = {
      activateCard: jest.fn(),
      getCardStatus: jest.fn(),
      getSensitiveCardInfo: jest.fn(),
    } as any;

    cardTransactionServiceMock = {
      findAll: jest.fn(),
      findAllMe: jest.fn(),
      createCard: jest.fn(),
      rechargeCard: jest.fn(),
      updateCardStatus: jest.fn(),
      updateVisibility: jest.fn(),
    } as any;

    cardShippingServiceMock = {
      getShippingPhysicalCard: jest.fn(),
      shippingPhysicalCard: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardController],
      providers: [
        {
          provide: CardIntegrationService,
          useValue: cardIntegrationServiceMock,
        },
        {
          provide: CardTransactionService,
          useValue: cardTransactionServiceMock,
        },
        { provide: CardShippingService, useValue: cardShippingServiceMock },
      ],
    }).compile();

    controller = module.get<CardController>(CardController);
  });

  describe('findAll', () => {
    it('should retrieve all card transactions when valid query parameters are provided', async () => {
      const mockQuery = new QuerySearchAnyDto();
      const mockResult: ResponsePaginator<AccountDocument> = {
        list: [mockAccount as AccountDocument],
        totalElements: 1,
        nextPage: null,
        prevPage: null,
        lastPage: null,
        firstPage: null,
        currentPage: 0,
        elementsPerPage: 0,
        order: [],
      };
      cardTransactionServiceMock.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(mockQuery);

      expect(result).toBe(mockResult);
      expect(cardTransactionServiceMock.findAll).toHaveBeenCalledWith(
        mockQuery,
      );
    });
  });

  describe('findAllMe', () => {
    it('should return all card transactions for the authenticated user', async () => {
      const mockQuery = new QuerySearchAnyDto();
      const mockReq = { user: mockUser };
      const mockResult: ResponsePaginator<AccountDocument> = {
        list: [mockAccount as AccountDocument],
        totalElements: 1,
        nextPage: null,
        prevPage: null,
        lastPage: null,
        firstPage: null,
        currentPage: 0,
        elementsPerPage: 0,
        order: [],
      };
      cardTransactionServiceMock.findAllMe.mockResolvedValue(mockResult);

      const result = await controller.findAllMe(mockQuery, mockReq);

      expect(result).toBe(mockResult);
      expect(cardTransactionServiceMock.findAllMe).toHaveBeenCalledWith(
        mockQuery,
        mockReq,
      );
    });
  });

  describe('createOne', () => {
    it('should create a card successfully when valid data is provided', async () => {
      const createDto = new CardCreateDto();
      createDto.name = 'Test Card';
      const mockReq = { user: mockUser };
      cardTransactionServiceMock.createCard.mockResolvedValue(
        mockAccount as AccountDocument,
      );

      const result = await controller.createOne(createDto, mockReq);

      expect(result).toBe(mockAccount);
      expect(cardTransactionServiceMock.createCard).toHaveBeenCalledWith(
        createDto,
        mockReq.user,
      );
    });
  });

  describe('rechargeCard', () => {
    it('should recharge card successfully when provided with valid CardDepositCreateDto', async () => {
      const toAccountId = new mongoose.Types.ObjectId();
      const fromAccountId = new mongoose.Types.ObjectId();
      const rechargeDto = new CardDepositCreateDto();
      rechargeDto.to =
        toAccountId.toHexString() as unknown as mongoose.Schema.Types.ObjectId;
      rechargeDto.from =
        fromAccountId as unknown as mongoose.Schema.Types.ObjectId;
      rechargeDto.amount = 100;
      const mockReq = { user: mockUser };
      const mockRechargedAccount = {
        ...mockAccount,
        _id: fromAccountId,
        amount: 100,
        amountCustodial: 100,
      };
      cardTransactionServiceMock.rechargeCard.mockResolvedValue(
        mockRechargedAccount as AccountDocument,
      );

      const result = await controller.rechargeCard(rechargeDto, mockReq);

      expect(result).toBe(mockRechargedAccount);
      expect(cardTransactionServiceMock.rechargeCard).toHaveBeenCalledWith(
        rechargeDto,
        mockReq.user,
      );
    });
  });

  describe('activateCard', () => {
    it('should activate card successfully with valid input data', async () => {
      const configActivate = new ConfigCardActivateDto();
      configActivate.pan = '5268080005638854';
      configActivate.pin = '1425';
      configActivate.promoCode = '14A25F';
      configActivate.prevCardId = '664dcd1529dabb0380754c73';
      const mockReq = { user: mockUser };
      const mockResult = { activated: true };
      cardIntegrationServiceMock.activateCard.mockResolvedValue(mockResult);

      const result = await controller.activateCard(configActivate, mockReq);

      expect(result).toBe(mockResult);
      expect(cardIntegrationServiceMock.activateCard).toHaveBeenCalledWith(
        mockReq.user,
        configActivate,
      );
    });

    it('should handle activation errors', async () => {
      const configActivate = new ConfigCardActivateDto();
      const mockReq = { user: mockUser };
      cardIntegrationServiceMock.activateCard.mockRejectedValue(
        new Error('Activation failed'),
      );

      await expect(
        controller.activateCard(configActivate, mockReq),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('status operations', () => {
    it('should lock the card when a valid cardId is provided', async () => {
      const cardId = new mongoose.Types.ObjectId().toString();
      const mockLockedAccount = {
        ...mockAccount,
        statusText: StatusAccountEnum.LOCK,
      };
      cardTransactionServiceMock.updateCardStatus.mockResolvedValue(
        mockLockedAccount as AccountDocument,
      );

      const result = await controller.blockedOneById(cardId);

      expect(result).toBe(mockLockedAccount);
      expect(cardTransactionServiceMock.updateCardStatus).toHaveBeenCalledWith(
        cardId,
        StatusAccountEnum.LOCK,
      );
    });

    it('should unlock the card when a valid cardId is provided', async () => {
      const cardId = new mongoose.Types.ObjectId().toString();
      const mockUnlockedAccount = {
        ...mockAccount,
        statusText: StatusAccountEnum.UNLOCK,
      };
      cardTransactionServiceMock.updateCardStatus.mockResolvedValue(
        mockUnlockedAccount as AccountDocument,
      );

      const result = await controller.unblockedOneById(cardId);

      expect(result).toBe(mockUnlockedAccount);
      expect(cardTransactionServiceMock.updateCardStatus).toHaveBeenCalledWith(
        cardId,
        StatusAccountEnum.UNLOCK,
      );
    });

    it('should cancel the card when a valid cardId is provided', async () => {
      const cardId = new mongoose.Types.ObjectId().toString();
      const mockCancelledAccount = {
        ...mockAccount,
        statusText: StatusAccountEnum.CANCEL,
      };
      cardTransactionServiceMock.updateCardStatus.mockResolvedValue(
        mockCancelledAccount as AccountDocument,
      );

      const result = await controller.cancelOneById(cardId);

      expect(result).toBe(mockCancelledAccount);
      expect(cardTransactionServiceMock.updateCardStatus).toHaveBeenCalledWith(
        cardId,
        StatusAccountEnum.CANCEL,
      );
    });
  });

  describe('visibility operations', () => {
    it('should disable card visibility when valid cardId is provided', async () => {
      const cardId = new mongoose.Types.ObjectId().toString();
      const mockHiddenAccount = {
        ...mockAccount,
        showToOwner: false,
      };
      cardTransactionServiceMock.updateVisibility.mockResolvedValue(
        mockHiddenAccount as AccountDocument,
      );

      const result = await controller.disableOneById(cardId);

      expect(result).toBe(mockHiddenAccount);
      expect(cardTransactionServiceMock.updateVisibility).toHaveBeenCalledWith(
        cardId,
        false,
      );
    });

    it('should enable card visibility when valid cardId is provided', async () => {
      const cardId = new mongoose.Types.ObjectId().toString();
      const mockVisibleAccount = {
        ...mockAccount,
        showToOwner: true,
      };
      cardTransactionServiceMock.updateVisibility.mockResolvedValue(
        mockVisibleAccount as AccountDocument,
      );

      const result = await controller.enableOneById(cardId);

      expect(result).toBe(mockVisibleAccount);
      expect(cardTransactionServiceMock.updateVisibility).toHaveBeenCalledWith(
        cardId,
        true,
      );
    });
  });

  describe('shipping operations', () => {
    it('should retrieve shipping information when card ID is valid', async () => {
      const cardId = new mongoose.Types.ObjectId().toString();
      const mockReq = { user: mockUser };
      const mockShippingResult = {
        id: '123456789',
        external_tracking_id: 'EXT123',
        status: 'shipped',
        status_detail: 'Package in transit',
        shipment_type: 'standard',
        affinity_group_id: 'AG123',
        affinity_group_name: 'Standard Delivery',
        courier: {
          company: 'DHL',
          tracking_url: 'https://tracking.dhl.com/123',
        },
        country_code: 'US',
        created_at: new Date().toISOString(),
        batch: {
          id: 'B123',
          quantity: 1,
          has_stock: true,
          status: 'active',
        },
        address: {
          street_name: 'Main St',
          street_number: '123',
          floor: '4',
          apartment: '401',
          city: 'New York',
          region: 'NY',
          country: 'USA',
          zip_code: '10001',
          neighborhood: 'Midtown',
          additional_info: 'Near Park',
        },
        receiver: {
          full_name: 'John Doe',
          email: 'john@example.com',
          document_type: 'ID',
          document_number: '123456',
          tax_identification_number: 'TAX123',
          telephone_number: '+1234567890',
        },
        user_id: mockUserId.toString(),
      };

      cardShippingServiceMock.getShippingPhysicalCard.mockResolvedValue(
        mockShippingResult,
      );

      await controller.getShippingPhysicalCard(cardId, mockReq);

      expect(
        cardShippingServiceMock.getShippingPhysicalCard,
      ).toHaveBeenCalledWith(cardId, mockReq.user);
    });

    it('should create a shipping request when valid API key is provided', async () => {
      const mockReq = { user: mockUser };
      const mockShippingResult: ShippingResult = {
        id: 'SHIP123',
        external_tracking_id: 'EXT456',
        status: 'created',
        status_detail: 'Ready for pickup',
        shipment_type: 'express',
        affinity_group_id: 'AG456',
        affinity_group_name: 'Express Delivery',
        courier: {
          company: 'FedEx',
          tracking_url: 'https://tracking.fedex.com/456',
        },
        country_code: 'US',
        created_at: new Date().toISOString(),
        batch: {
          id: 'B456',
          quantity: 1,
          has_stock: true,
          status: 'pending',
        },
        address: {
          street_name: 'Broadway',
          street_number: '456',
          floor: '2',
          apartment: '2B',
          city: 'New York',
          region: 'NY',
          country: 'USA',
          zip_code: '10002',
          neighborhood: 'Downtown',
          additional_info: 'Front desk',
        },
        receiver: {
          full_name: mockUser.name || 'Test User',
          email: mockUser.email || 'test@example.com',
          document_type: 'ID',
          document_number: '123456',
          tax_identification_number: 'TAX456',
          telephone_number: '+1987654321',
        },
        user_id: mockUserId.toString(),
      };
      cardShippingServiceMock.shippingPhysicalCard.mockResolvedValue(
        mockShippingResult as unknown as AccountDocument,
      );

      const result = await controller.createShippingPhysicalCard(mockReq);

      expect(result).toBe(mockShippingResult);
      expect(cardShippingServiceMock.shippingPhysicalCard).toHaveBeenCalledWith(
        mockReq.user,
      );
    });
  });
  describe('getSensitiveInfo', () => {
    it('should return HTML content when cardId and user are valid', async () => {
      const cardId = new mongoose.Types.ObjectId().toString();
      const mockReq = { user: mockUser };
      const mockRes = {
        setHeader: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const mockHtml = '<html>Card Info</html>';

      cardIntegrationServiceMock.getSensitiveCardInfo.mockResolvedValue(
        mockHtml,
      );

      await controller.getSensitiveInfo(cardId, mockRes, mockReq);

      expect(
        cardIntegrationServiceMock.getSensitiveCardInfo,
      ).toHaveBeenCalledWith(cardId, mockReq.user);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/html; charset=utf-8',
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith(mockHtml);
    });
  });

  describe('deleteOneById', () => {
    it('should throw UnauthorizedException', async () => {
      const cardId = new mongoose.Types.ObjectId().toString();
      try {
        await controller.deleteOneById(cardId);
        fail('Expected UnauthorizedException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }
    });
  });

  describe('checkCardsInPomelo', () => {
    it('should return 200 status code when the endpoint is accessed', async () => {
      const response = await controller.checkCardsInPomelo();
      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('Started checking cards in Pomelo');
    });
  });
});
