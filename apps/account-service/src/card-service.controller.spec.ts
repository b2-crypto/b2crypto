import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CardServiceController } from './card-service.controller';
import { AccountServiceService } from './account-service.service';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { StatusServiceService } from 'apps/status-service/src/status-service.service';
import { GroupServiceService } from 'apps/group-service/src/group-service.service';
import { BuildersService } from '@builder/builders';
import { IntegrationService } from '@integration/integration';
import { CategoryServiceService } from '../../category-service/src/category-service.service';
import { FiatIntegrationClient } from 'apps/integration-service/src/clients/fiat.integration.client';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { User } from '@user/user/entities/mongoose/user.schema';
import { CardCreateDto } from '@account/account/dto/card.create.dto';
import { CardDepositCreateDto } from '@account/account/dto/card-deposit.create.dto';
import CardTypesAccountEnum from '@account/account/enum/card.types.account.enum';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { CardsEnum } from '@common/common/enums/messages.enum';
import EventsNamesAccountEnum from './enum/events.names.account.enum';
import mongoose from 'mongoose';
import { RmqContext } from '@nestjs/microservices';

jest.mock('@common/common');

describe('CardServiceController', () => {
  let controller: CardServiceController;
  let accountServiceMock: jest.Mocked<AccountServiceService>;
  let integrationServiceMock: jest.Mocked<IntegrationService>;
  let buildersServiceMock: jest.Mocked<BuildersService>;
  let userServiceMock: jest.Mocked<UserServiceService>;
  let categoryServiceMock: jest.Mocked<CategoryServiceService>;
  let statusServiceMock: jest.Mocked<StatusServiceService>;
  let groupServiceMock: jest.Mocked<GroupServiceService>;
  let configServiceMock: jest.Mocked<ConfigService>;
  let fiatIntegrationClientMock: jest.Mocked<FiatIntegrationClient>;

  beforeEach(async () => {
    accountServiceMock = {
      findAll: jest.fn(),
      createOne: jest.fn(),
      findOneById: jest.fn(),
      customUpdateOne: jest.fn(),
      deleteOneById: jest.fn(),
    } as any;
    integrationServiceMock = {
      getCardIntegration: jest.fn(),
    } as any;
    buildersServiceMock = {
      getPromiseAccountEventClient: jest.fn(),
      emitAccountEventClient: jest.fn(),
      getPromiseCategoryEventClient: jest.fn(),
      getPromiseStatusEventClient: jest.fn(),
      getPromisePspAccountEventClient: jest.fn(),
      emitTransferEventClient: jest.fn(),
      getPromiseUserEventClient: jest.fn(),
      emitUserEventClient: jest.fn(),
    } as any;
    userServiceMock = {} as any;
    categoryServiceMock = {
      getAll: jest.fn(),
      newCategory: jest.fn(),
    } as any;
    statusServiceMock = {
      getAll: jest.fn(),
    } as any;
    groupServiceMock = {
      getAll: jest.fn(),
      newGroup: jest.fn(),
    } as any;
    configServiceMock = {
      get: jest.fn(),
    } as any;
    fiatIntegrationClientMock = {
      getCurrencyConversion: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardServiceController],
      providers: [
        { provide: AccountServiceService, useValue: accountServiceMock },
        { provide: IntegrationService, useValue: integrationServiceMock },
        { provide: BuildersService, useValue: buildersServiceMock },
        { provide: UserServiceService, useValue: userServiceMock },
        { provide: CategoryServiceService, useValue: categoryServiceMock },
        { provide: StatusServiceService, useValue: statusServiceMock },
        { provide: GroupServiceService, useValue: groupServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: FiatIntegrationClient, useValue: fiatIntegrationClientMock },
      ],
    }).compile();

    controller = module.get<CardServiceController>(CardServiceController);
  });

  describe('findAll', () => {
    it('should return all cards', async () => {
      const mockCards: ResponsePaginator<AccountDocument> = {
        list: [{ type: TypesAccountEnum.CARD } as AccountDocument],
        totalElements: 1,
      } as ResponsePaginator<AccountDocument>;
      accountServiceMock.findAll.mockResolvedValue(mockCards);

      const result = await controller.findAll({});

      expect(result).toEqual(mockCards);
      expect(accountServiceMock.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { type: TypesAccountEnum.CARD }
      }));
    });
  });
  describe('findAllMe', () => {
    it('should return all cards for the user', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockCards: ResponsePaginator<AccountDocument> = {
        list: [{ 
          type: TypesAccountEnum.CARD, 
          owner: mockUserId, 
          amount: 100, 
          amountCustodial: 100,
          currency: 'USD',
          currencyCustodial: 'USD'
        } as unknown as AccountDocument],
        totalElements: 1,
      } as ResponsePaginator<AccountDocument>;
      
      accountServiceMock.findAll.mockResolvedValue(mockCards);
      
      jest.spyOn(controller as any, 'swapToCurrencyUser').mockResolvedValue(100);
  
      const mockReq = { user: { id: mockUserId.toString(), currency: 'EUR' } };
      const result = await controller.findAllMe({}, mockReq);
  
      expect(result.list[0].amount).toBe(100);
      expect(result.list[0].currency).toBe('USD');
      
     
      expect(accountServiceMock.findAll).toHaveBeenCalled();
      
    
      console.log('All calls to findAll:', accountServiceMock.findAll.mock.calls);
  
    
      accountServiceMock.findAll.mock.calls.forEach((call, index) => {
        console.log(`Call ${index} arguments:`, call);
      });
  
   
      if (accountServiceMock.findAll.mock.calls.length > 0) {
        const firstCallArgs = accountServiceMock.findAll.mock.calls[0];
        console.log('First call arguments:', firstCallArgs);
  
     
        if (typeof firstCallArgs[0] === 'object' && firstCallArgs[0] !== null) {
          console.log('First argument is an object:', firstCallArgs[0]);
          
         
          if ('where' in firstCallArgs[0]) {
            console.log('Where clause:', firstCallArgs[0].where);
            expect(firstCallArgs[0].where).toEqual(expect.objectContaining({
              type: TypesAccountEnum.CARD,
              owner: mockUserId
            }));
          } else {
            console.log('No "where" property found in the first argument');
          }
        } else {
          console.log('First argument is not an object:', firstCallArgs[0]);
        }
      } else {
        console.log('No calls were made to findAll');
      }
  
      expect(controller['swapToCurrencyUser']).toHaveBeenCalledWith(mockReq, expect.anything());
    });
    it('should maintain original currency even if user currency is different', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockCards: ResponsePaginator<AccountDocument> = {
        list: [{ 
          type: TypesAccountEnum.CARD, 
          owner: mockUserId, 
          amount: 100, 
          amountCustodial: 100,
          currency: 'USD',
          currencyCustodial: 'USD'
        } as unknown as AccountDocument],
        totalElements: 1,
      } as ResponsePaginator<AccountDocument>;
      
      accountServiceMock.findAll.mockResolvedValue(mockCards);
      
      jest.spyOn(controller as any, 'swapToCurrencyUser').mockResolvedValue(100);
  
      const mockReq = { user: { id: mockUserId.toString(), currency: 'EUR' } };
      const result = await controller.findAllMe({}, mockReq);
  
      expect(result.list[0].amount).toBe(100);
      expect(result.list[0].currency).toBe('USD');
      expect(controller['swapToCurrencyUser']).toHaveBeenCalledWith(mockReq, expect.anything());
    });
  });

  describe('createOne', () => {
    it('should create a virtual card when valid data is provided', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        personalData: {
          email: ['user@example.com'],
          location: { address: {} },
        },
        email: 'user@example.com',
      } as unknown as User;
      
      jest.spyOn(controller as any, 'getUser').mockResolvedValue(mockUser);
      jest.spyOn(controller as any, 'buildAFG').mockResolvedValue({ list: [{ valueGroup: 'groupId' }] });
      jest.spyOn(controller as any, 'getUserCard').mockResolvedValue({});

      accountServiceMock.findAll.mockResolvedValue({ totalElements: 0 } as ResponsePaginator<AccountDocument>);
      accountServiceMock.createOne.mockResolvedValue({ _id: new mongoose.Types.ObjectId(), save: jest.fn() } as any);
      
      const mockCardIntegration = {
        createCard: jest.fn().mockResolvedValue({ data: {} }),
      };
      integrationServiceMock.getCardIntegration.mockResolvedValue(mockCardIntegration as any);

      const createDto = new CardCreateDto();
      createDto.accountType = CardTypesAccountEnum.VIRTUAL;

      const mockReq = { user: { id: mockUserId.toString() } };

      const result = await controller.createOne(createDto, mockReq as any);

      expect(result).toBeDefined();
      expect(accountServiceMock.createOne).toHaveBeenCalledWith(expect.objectContaining({
        owner: expect.any(mongoose.Types.ObjectId),
        accountType: CardTypesAccountEnum.VIRTUAL,
      }));
    });

    it('should throw BadRequestException for physical card creation if user already has 10 virtual cards', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        personalData: {},
      } as unknown as User;
      
      jest.spyOn(controller as any, 'getUser').mockResolvedValue(mockUser);
      accountServiceMock.findAll.mockResolvedValue({ totalElements: 10 } as ResponsePaginator<AccountDocument>);

      const createDto = new CardCreateDto();
      createDto.accountType = CardTypesAccountEnum.VIRTUAL;

      const mockReq = { user: { id: mockUserId.toString() } };

      await expect(controller.createOne(createDto, mockReq as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('rechargeOne', () => {
    it('should recharge a card successfully', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        personalData: {},
      } as unknown as User;
      
      jest.spyOn(controller as any, 'getUser').mockResolvedValue(mockUser);
      
      const mockCard = { _id: new mongoose.Types.ObjectId(), type: TypesAccountEnum.CARD } as AccountDocument;
      const mockWallet = { _id: new mongoose.Types.ObjectId(), type: TypesAccountEnum.WALLET, amount: 100 } as AccountDocument;
      
      accountServiceMock.findOneById.mockResolvedValueOnce(mockCard);
      accountServiceMock.findOneById.mockResolvedValueOnce(mockWallet);
      accountServiceMock.customUpdateOne.mockResolvedValue({} as any);
      
      buildersServiceMock.getPromiseCategoryEventClient.mockResolvedValue({ _id: 'categoryId' });
      buildersServiceMock.getPromiseStatusEventClient.mockResolvedValue({ _id: 'statusId' });
      buildersServiceMock.getPromisePspAccountEventClient.mockResolvedValue({ _id: 'pspAccountId', psp: 'pspId' });

      const createDto = new CardDepositCreateDto();
      createDto.amount = 50;
      createDto.from = mockWallet._id;
      createDto.to = mockCard._id;

      const mockReq = { user: { id: mockUserId.toString() }, get: jest.fn() };

      await controller.rechargeOne(createDto, mockReq as any);

      expect(accountServiceMock.customUpdateOne).toHaveBeenCalledTimes(2);
      expect(buildersServiceMock.emitTransferEventClient).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if amount is less than 10', async () => {
      const createDto = new CardDepositCreateDto();
      createDto.amount = 5;
  
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        personalData: {},
      } as unknown as User;
  
      jest.spyOn(controller as any, 'getUser').mockResolvedValue(mockUser);
  
      const mockReq = { user: { id: mockUserId.toString() } };
  
      await expect(controller.rechargeOne(createDto, mockReq as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getShippingPhysicalCard', () => {
    beforeEach(() => {
      jest.spyOn(controller as any, 'getUser').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        personalData: {},
      } as unknown as User);
    });
  
    it('should return shipping information for a physical card', async () => {
      const mockCardId = new mongoose.Types.ObjectId().toString();
      const mockCard = { 
        responseShipping: { id: 'shippingId' },
        owner: new mongoose.Types.ObjectId(),
      } as unknown as AccountDocument;
      
      accountServiceMock.findOneById.mockResolvedValue(mockCard);
      
      const mockCardIntegration = {
        getShippingPhysicalCard: jest.fn().mockResolvedValue({ data: { status: 'shipped' } }),
      };
      integrationServiceMock.getCardIntegration.mockResolvedValue(mockCardIntegration as any);
  
      const result = await controller.getShippingPhysicalCard(mockCardId);
  
      expect(result).toEqual({ id: 'shippingId' });
      expect(accountServiceMock.findOneById).toHaveBeenCalledWith(mockCardId);
      expect(mockCardIntegration.getShippingPhysicalCard).toHaveBeenCalledWith('shippingId');
    });
  
    it('should throw BadRequestException if card has no shipping information', async () => {
      const mockCardId = new mongoose.Types.ObjectId().toString();
      const mockCard = {
        owner: new mongoose.Types.ObjectId(),
      } as unknown as AccountDocument;
      
      accountServiceMock.findOneById.mockResolvedValue(mockCard);
  
      await expect(controller.getShippingPhysicalCard(mockCardId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('shippingPhysicalCard', () => {
    it('should create a shipping request for a physical card', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        personalData: {
          location: { address: {} },
          name: 'John',
          lastName: 'Doe',
          typeDocId: 'CC',
          numDocId: '123456',
          telephones: [{ phoneNumber: '1234567890' }],
        },
        email: 'john@example.com',
      } as unknown as User;

      jest.spyOn(controller as any, 'getUser').mockResolvedValue(mockUser);
      jest.spyOn(controller as any, 'getUserCard').mockResolvedValue({ id: 'userCardId' });
      
      accountServiceMock.findAll.mockResolvedValue({ totalElements: 0 } as ResponsePaginator<AccountDocument>);
      
      const mockCardIntegration = {
        shippingPhysicalCard: jest.fn().mockResolvedValue({ data: { id: 'shippingId' } }),
      };
      integrationServiceMock.getCardIntegration.mockResolvedValue(mockCardIntegration as any);

      accountServiceMock.createOne.mockResolvedValue({ _id: new mongoose.Types.ObjectId() } as AccountDocument);

      const mockReq = { user: { id: mockUserId.toString() } };
      const result = await controller.shippingPhysicalCard(mockReq as any);

      expect(result).toBeDefined();
      expect(mockCardIntegration.shippingPhysicalCard).toHaveBeenCalled();
      expect(accountServiceMock.createOne).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already has a pending physical card', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        personalData: { location: { address: {} } },
      } as unknown as User;

      jest.spyOn(controller as any, 'getUser').mockResolvedValue(mockUser);
      accountServiceMock.findAll.mockResolvedValue({ totalElements: 1 } as ResponsePaginator<AccountDocument>);

      const mockReq = { user: { id: mockUserId.toString() } };
      await expect(controller.shippingPhysicalCard(mockReq as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('blockedOneById', () => {
    it('should block a card', async () => {
      const mockCardId = new mongoose.Types.ObjectId().toString();
      jest.spyOn(controller as any, 'updateStatusAccount').mockResolvedValue({});

      await controller.blockedOneById(mockCardId);

      expect(controller['updateStatusAccount']).toHaveBeenCalledWith(mockCardId, StatusAccountEnum.LOCK);
    });
  });

  describe('unblockedOneById', () => {
    it('should unblock a card', async () => {
      const mockCardId = new mongoose.Types.ObjectId().toString();
      jest.spyOn(controller as any, 'updateStatusAccount').mockResolvedValue({});

      await controller.unblockedOneById(mockCardId);

      expect(controller['updateStatusAccount']).toHaveBeenCalledWith(mockCardId, StatusAccountEnum.UNLOCK);
    });
  });

  describe('cancelOneById', () => {
    it('should cancel a card', async () => {
      const mockCardId = new mongoose.Types.ObjectId().toString();
      jest.spyOn(controller as any, 'updateStatusAccount').mockResolvedValue({});

      await controller.cancelOneById(mockCardId);

      expect(controller['updateStatusAccount']).toHaveBeenCalledWith(mockCardId, StatusAccountEnum.CANCEL);
    });
  });

  describe('disableOneById', () => {
    it('should disable a card', async () => {
      const mockCardId = new mongoose.Types.ObjectId().toString();
      jest.spyOn(controller as any, 'toggleVisibleToOwner').mockResolvedValue({});

      await controller.disableOneById(mockCardId);

      expect(controller['toggleVisibleToOwner']).toHaveBeenCalledWith(mockCardId, false);
    });
  });

  describe('enableOneById', () => {
    it('should enable a card', async () => {
      const mockCardId = new mongoose.Types.ObjectId().toString();
      jest.spyOn(controller as any, 'toggleVisibleToOwner').mockResolvedValue({});

      await controller.enableOneById(mockCardId);

      expect(controller['toggleVisibleToOwner']).toHaveBeenCalledWith(mockCardId, true);
    });
  });

  describe('deleteOneById', () => {
    it('should throw UnauthorizedException', async () => {
      const mockCardId = new mongoose.Types.ObjectId().toString();
  
      try {
        await controller.deleteOneById(mockCardId);
        fail('Expected UnauthorizedException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }
    });
    it('should throw UnauthorizedException and not call accountServiceService.deleteOneById', async () => {
      const mockCardId = new mongoose.Types.ObjectId().toString();
  
      let thrownError: Error | null = null;
      try {
        await controller.deleteOneById(mockCardId);
      } catch (error) {
        thrownError = error as Error;
      }
  
      expect(thrownError).toBeInstanceOf(UnauthorizedException);
      expect(accountServiceMock.deleteOneById).not.toHaveBeenCalled();
    });
  });
  describe('processPomeloTransaction', () => {
    it('should process a Pomelo transaction successfully', async () => {
      const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
      const mockData = {
        id: 'cardId',
        authorize: true,
        amount: 50,
      };
      const mockCard = {
        _id: new mongoose.Types.ObjectId(),
        amount: 100,
        statusText: StatusAccountEnum.UNLOCK,
      } as AccountDocument;

      accountServiceMock.findAll.mockResolvedValue({
        list: [mockCard],
        totalElements: 1,
      } as ResponsePaginator<AccountDocument>);
      accountServiceMock.customUpdateOne.mockResolvedValue({} as any);

      configServiceMock.get.mockReturnValue(0.1); // BLOCK_BALANCE_PERCENTAGE

      const result = await controller.processPomeloTransaction(mockCtx, mockData);

      expect(result).toBe(CardsEnum.CARD_PROCESS_OK);
      expect(accountServiceMock.customUpdateOne).toHaveBeenCalledWith(expect.objectContaining({
        id: mockCard._id,
        $inc: { amount: -50 },
      }));
    });

    it('should return CARD_PROCESS_CARD_NOT_FOUND if card is not found', async () => {
      const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
      const mockData = { id: 'nonexistentCardId' };

      accountServiceMock.findAll.mockResolvedValue({
        list: [],
        totalElements: 0,
      } as ResponsePaginator<AccountDocument>);

      const result = await controller.processPomeloTransaction(mockCtx, mockData);

      expect(result).toBe(CardsEnum.CARD_PROCESS_CARD_NOT_FOUND);
    });
  });

  describe('findByCardId', () => {
    it('should find a card by its ID', async () => {
      const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
      const mockData = { id: 'cardId' };
      const mockCard = { _id: new mongoose.Types.ObjectId(), cardConfig: { id: 'cardId' } } as AccountDocument;

      accountServiceMock.findAll.mockResolvedValue({
        list: [mockCard],
        totalElements: 1,
      } as ResponsePaginator<AccountDocument>);

      const result = await controller.findByCardId(mockCtx, mockData);

      expect(result).toEqual(mockCard);
    });

  });

  describe('migrateCard', () => {
    it('should migrate a card successfully', async () => {
      const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
      const mockCardToMigrate = new CardCreateDto();
      mockCardToMigrate.cardConfig = { id: 'cardId' } as any;

      const mockGroup = { list: [{ _id: new mongoose.Types.ObjectId() }] };
      jest.spyOn(controller as any, 'buildAFG').mockResolvedValue(mockGroup);

      accountServiceMock.findAll.mockResolvedValue({
        list: [],
        totalElements: 0,
      } as ResponsePaginator<AccountDocument>);

      const mockCreatedCard = { _id: new mongoose.Types.ObjectId() } as AccountDocument;
      accountServiceMock.createOne.mockResolvedValue(mockCreatedCard);

      const result = await controller.migrateCard(mockCtx, mockCardToMigrate);

      expect(result).toEqual(mockCreatedCard);
      expect(accountServiceMock.createOne).toHaveBeenCalledWith(expect.objectContaining({
        group: mockGroup.list[0],
      }));
    });
  });

  describe('finalALlCardsToMigrate', () => {
    it('should return all cards to migrate', async () => {
      const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
      const mockData = { where: {} };
      const mockCards = {
        list: [{ _id: new mongoose.Types.ObjectId() }],
        totalElements: 1,
      } as ResponsePaginator<AccountDocument>;

      accountServiceMock.findAll.mockResolvedValue(mockCards);

      const result = await controller.finalALlCardsToMigrate(mockCtx, mockData);

      expect(result).toEqual(mockCards);
    });

  
  });

  describe('setCardOwner', () => {
    it('should update the card owner', async () => {
      const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
      const mockData = { id: 'cardId', owner: new mongoose.Types.ObjectId() };
      const mockCard = { _id: new mongoose.Types.ObjectId() } as AccountDocument;

      accountServiceMock.findAll.mockResolvedValue({
        list: [mockCard],
        totalElements: 1,
      } as ResponsePaginator<AccountDocument>);

      await controller.setCardOwner(mockCtx, mockData);

      expect(accountServiceMock.customUpdateOne).toHaveBeenCalledWith(expect.objectContaining({
        id: mockCard._id,
        owner: mockData.owner,
      }));
    });

  });

  describe('setBalanceByCard', () => {
    it('should set the balance for a card', async () => {
      const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
      const mockData = { id: 'cardId', amount: 100 };
      const mockCard = { _id: new mongoose.Types.ObjectId(), amount: 0, amountCustodial: 0 } as AccountDocument;

      accountServiceMock.findAll.mockResolvedValue({
        list: [mockCard],
        totalElements: 1,
      } as ResponsePaginator<AccountDocument>);

      await controller.setBalanceByCard(mockCtx, mockData);

      expect(accountServiceMock.customUpdateOne).toHaveBeenCalledWith(expect.objectContaining({
        id: mockCard._id,
        $inc: { amount: 100, amountCustodial: 100 },
      }));
    });

  });
});