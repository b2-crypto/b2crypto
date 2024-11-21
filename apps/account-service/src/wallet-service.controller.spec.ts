import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { WalletServiceController } from './wallet-service.controller';
import { AccountServiceService } from './account-service.service';
import { UserServiceService } from '../../user-service/src/user-service.service';
import { BuildersService } from '@builder/builders';
import { IntegrationService } from '@integration/integration';
import { WalletServiceService } from './wallet-service.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import { WalletDepositCreateDto } from '@account/account/dto/wallet-deposit.create.dto';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { CommonService } from '@common/common';
import { Cache } from 'cache-manager';
import { RmqContext } from '@nestjs/microservices';
import mongoose from 'mongoose';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';

jest.mock('@common/common');

describe('WalletServiceController', () => {
  let controller: WalletServiceController;
  let accountServiceMock: jest.Mocked<AccountServiceService>;
  let walletServiceMock: jest.Mocked<WalletServiceService>;
  let userServiceMock: jest.Mocked<UserServiceService>;
  let buildersServiceMock: jest.Mocked<BuildersService>;
  let integrationServiceMock: jest.Mocked<IntegrationService>;
  let configServiceMock: jest.Mocked<ConfigService>;
  let cacheManagerMock: jest.Mocked<Cache>;

  beforeEach(async () => {
    accountServiceMock = {
      findAll: jest.fn(),
      findOneById: jest.fn(),
      createOne: jest.fn(),
      availableWalletsFireblocks: jest.fn(),
    } as any;

    walletServiceMock = {
      createWalletB2BinPay: jest.fn(),
      createWalletFireblocks: jest.fn(),
      rechargeWallet: jest.fn(),
      updateStatusAccount: jest.fn(),
      toggleVisibleToOwner: jest.fn(),
      sweepOmnibus: jest.fn(),
    } as any;

    userServiceMock = {
      getAll: jest.fn(),
    } as any;

    buildersServiceMock = {
      emitAccountEventClient: jest.fn(),
    } as any;

    integrationServiceMock = {} as any;
    configServiceMock = {
      get: jest.fn(),
    } as any;

    cacheManagerMock = {
      get: jest.fn(),
      set: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletServiceController],
      providers: [
        { provide: AccountServiceService, useValue: accountServiceMock },
        { provide: WalletServiceService, useValue: walletServiceMock },
        { provide: UserServiceService, useValue: userServiceMock },
        { provide: BuildersService, useValue: buildersServiceMock },
        { provide: IntegrationService, useValue: integrationServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
      ],
    }).compile();

    controller = module.get<WalletServiceController>(WalletServiceController);
  });

  describe('findAll', () => {
    it('should return all wallets with correct filters', async () => {
      const mockWallets: ResponsePaginator<any> = {
        list: [{ type: TypesAccountEnum.WALLET }],
        totalElements: 1,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: []
      };

      accountServiceMock.findAll.mockResolvedValue(mockWallets);

      const result = await controller.findAll({}, { clientApi: {} });

      expect(result).toEqual(mockWallets);
      expect(accountServiceMock.findAll).toHaveBeenCalledWith({
        where: {
          type: TypesAccountEnum.WALLET,
          showToOwner: true
        }
      });
    });
  });

  describe('findAllMe', () => {
    it('should create default wallet if none exists and return all wallets', async () => {
      const userId = 'user123';
      jest.spyOn(CommonService, 'getUserId').mockReturnValue(userId);
      jest.spyOn(CommonService, 'getQueryWithUserId').mockImplementation((query) => ({
        ...query,
        where: { ...query.where, owner: userId }
      }));
      jest.spyOn(CommonService, 'getNumberDigits').mockReturnValue('1234');
      jest.spyOn(CommonService, 'randomIntNumber').mockReturnValue(1234);

      const query = {
        where: {
          owner: userId,
          type: TypesAccountEnum.WALLET,
          showToOwner: true
        }
      };

      const emptyWallets: ResponsePaginator<any> = {
        list: [],
        totalElements: 0,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: []
      };

      const populatedWallets: ResponsePaginator<any> = {
        ...emptyWallets,
        list: [{ type: TypesAccountEnum.WALLET }],
        totalElements: 1
      };

      accountServiceMock.findAll
        .mockResolvedValueOnce(emptyWallets)
        .mockResolvedValueOnce(populatedWallets);

      cacheManagerMock.get.mockResolvedValue(false);

      const mockReq = {
        user: { id: userId },
        clientApi: {}
      };

      const result = await controller.findAllMe(query, mockReq);

      expect(walletServiceMock.createWalletFireblocks).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: userId,
          name: 'USD Tether (Tron)',
          accountType: WalletTypesAccountEnum.VAULT,
          type: TypesAccountEnum.WALLET,
          pin: '1234',
          currency: CurrencyCodeB2cryptoEnum.USDT
        }),
        userId
      );

      expect(cacheManagerMock.set).toHaveBeenCalledWith(
        `create-wallet-${userId}`,
        true,
        6 * 1000
      );

      expect(result).toEqual(populatedWallets);
    });

    it('should not create default wallet if one already exists', async () => {
      const userId = 'user123';
      jest.spyOn(CommonService, 'getUserId').mockReturnValue(userId);
      jest.spyOn(CommonService, 'getQueryWithUserId').mockImplementation((query) => ({
        ...query,
        where: { ...query.where, owner: userId }
      }));

      const query = {
        where: {
          owner: userId,
          type: TypesAccountEnum.WALLET,
          showToOwner: true
        }
      };

      const existingWallets: ResponsePaginator<any> = {
        list: [{ type: TypesAccountEnum.WALLET }],
        totalElements: 1,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: []
      };

      accountServiceMock.findAll.mockResolvedValue(existingWallets);
      cacheManagerMock.get.mockResolvedValue(false);

      const mockReq = {
        user: { id: userId },
        clientApi: {}
      };

      const result = await controller.findAllMe(query, mockReq);

      expect(walletServiceMock.createWalletFireblocks).not.toHaveBeenCalled();
      expect(result).toEqual(existingWallets);
    });

    it('should not create default wallet if creation is in progress', async () => {
      const userId = 'user123';
      jest.spyOn(CommonService, 'getUserId').mockReturnValue(userId);
      jest.spyOn(CommonService, 'getQueryWithUserId').mockImplementation((query) => ({
        ...query,
        where: { ...query.where, owner: userId }
      }));

      const query = {
        where: {
          owner: userId,
          type: TypesAccountEnum.WALLET,
          showToOwner: true
        }
      };

      const emptyWallets: ResponsePaginator<any> = {
        list: [],
        totalElements: 0,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: []
      };

      accountServiceMock.findAll.mockResolvedValue(emptyWallets);
      cacheManagerMock.get.mockResolvedValue(true);

      const mockReq = {
        user: { id: userId },
        clientApi: {}
      };

      const result = await controller.findAllMe(query, mockReq);

      expect(walletServiceMock.createWalletFireblocks).not.toHaveBeenCalled();
      expect(result).toEqual(emptyWallets);
    });
  });

  describe('availablesWallet', () => {
    it('should return available wallets from Fireblocks', async () => {
      const mockQuery = { where: { brand: 'testBrand' } };
      const mockReq = { user: { brand: 'testBrand' } };

      await controller.availablesWallet(mockQuery, mockReq);

      expect(accountServiceMock.availableWalletsFireblocks).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            type: TypesAccountEnum.WALLET,
            brand: 'testBrand'
          }
        })
      );
    });
  });

  describe('createOne', () => {
    it('should create EWALLET type wallet', async () => {
      const createDto = {
        accountType: WalletTypesAccountEnum.EWALLET,
      } as WalletCreateDto;
      const mockReq = { user: { brand: 'testBrand', id: 'userId' } };

      await controller.createOne(createDto, mockReq);

      expect(walletServiceMock.createWalletB2BinPay).toHaveBeenCalledWith(
        expect.objectContaining({
          accountType: WalletTypesAccountEnum.EWALLET,
          brand: 'testBrand'
        }),
        'userId'
      );
    });

    it('should create VAULT type wallet', async () => {
      const createDto = {
        accountType: WalletTypesAccountEnum.VAULT,
      } as WalletCreateDto;
      const mockReq = { user: { brand: 'testBrand', id: 'userId' } };

      await controller.createOne(createDto, mockReq);

      expect(walletServiceMock.createWalletFireblocks).toHaveBeenCalledWith(
        expect.objectContaining({
          accountType: WalletTypesAccountEnum.VAULT,
          brand: 'testBrand'
        }),
        'userId'
      );
    });

    it('should throw BadRequestException for invalid accountType', async () => {
      const createDto = {
        accountType: 'INVALID' as WalletTypesAccountEnum,
      } as WalletCreateDto;
      const mockReq = { user: { brand: 'testBrand' } };

      await expect(controller.createOne(createDto, mockReq))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('rechargeOne', () => {
    it('should recharge wallet successfully', async () => {
      const createDto = new WalletDepositCreateDto();
      const mockReq = {
        user: { id: 'userId' },
        get: jest.fn().mockReturnValue('test.host.com')
      };

      const mockResponse = {
        statusCode: 200,
        data: {
          txId: 'tx123',
          url: 'https://example.com/tx',
          address: 'wallet123',
          chain: 'ETH'
        }
      };

      walletServiceMock.rechargeWallet.mockResolvedValue(mockResponse);

      const result = await controller.rechargeOne(createDto, mockReq);

      expect(result).toEqual(mockResponse);
      expect(walletServiceMock.rechargeWallet).toHaveBeenCalledWith(
        createDto,
        'userId',
        'test.host.com'
      );
    });

    it('should throw BadRequestException on error', async () => {
      const createDto = new WalletDepositCreateDto();
      const mockReq = {
        user: { id: 'userId' },
        get: jest.fn().mockReturnValue('test.host.com')
      };

      walletServiceMock.rechargeWallet.mockRejectedValue(new Error('Recharge failed'));

      await expect(controller.rechargeOne(createDto, mockReq))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException when required fields are missing', async () => {
      const createDto = new WalletDepositCreateDto();
      const mockReq = {
        user: { id: 'userId' },
        get: jest.fn().mockReturnValue('test.host.com')
      };

      walletServiceMock.rechargeWallet.mockRejectedValue(
        new BadRequestException('Required fields are missing')
      );

      await expect(controller.rechargeOne(createDto, mockReq))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should handle successful recharge with account document response', async () => {
      const fromId = new mongoose.Types.ObjectId();
      const toId = new mongoose.Types.ObjectId();

      const createDto: WalletDepositCreateDto = {
        amount: 100,
        from: fromId as any,
        to: toId as any,
        pin: ''
      };

      const mockReq = {
        user: { id: 'userId' },
        get: jest.fn().mockReturnValue('test.host.com')
      };

      const mockAccountResponse = {
        _id: new mongoose.Types.ObjectId(),
        id: new mongoose.Types.ObjectId().toString(),
        searchText: 'account search text',
        name: 'Test Account',
        docId: 'doc123',
        secret: 'secret123',
        slug: 'test-account',
        owner: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        telephone: '+1234567890',
        description: 'Test account description',
        pin: '1234',
        type: TypesAccountEnum.WALLET,
        accountType: WalletTypesAccountEnum.VAULT,
        decimals: 8,
        hasSendDisclaimer: false,
        totalTransfer: 0,
        quantityTransfer: 0,
        showToOwner: true,
        statusText: StatusAccountEnum.UNLOCK,
        accountStatus: [],
        amount: 1000,
        currency: CurrencyCodeB2cryptoEnum.USDT,
        amountCustodial: 0,
        currencyCustodial: CurrencyCodeB2cryptoEnum.USDT,
        amountBlocked: 0,
        currencyBlocked: CurrencyCodeB2cryptoEnum.USDT,
        amountBlockedCustodial: 0,
        currencyBlockedCustodial: CurrencyCodeB2cryptoEnum.USDT,
        address: 'wallet_address_123',
        afgId: 'afg123',
        brand: 'test_brand',
        cardConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        $assertPopulated: jest.fn(),
        $clone: jest.fn(),
        $getAllSubdocs: jest.fn(),
        $ignore: jest.fn(),
        $isDefault: jest.fn(),
        $isDeleted: jest.fn(),
        $getPopulatedDocs: jest.fn(),
        $inc: jest.fn(),
        $isEmpty: jest.fn(),
        $isValid: jest.fn(),
        $markValid: jest.fn(),
        $model: jest.fn(),
        $op: null,
        $parent: jest.fn(),
        $set: jest.fn(),
        $session: jest.fn(),
        $populated: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        save: jest.fn(),
        isModified: jest.fn(),
        $locals: {},
        errors: {},
        isNew: false,
        schema: {},
        depopulate: jest.fn(),
        equals: jest.fn(),
        init: jest.fn(),
        inspect: jest.fn(),
        invalidate: jest.fn(),
        modifiedPaths: jest.fn(),
        populate: jest.fn(),
        populated: jest.fn(),
        toJSON: jest.fn(),
        toObject: jest.fn(),
        unmarkModified: jest.fn(),
        validate: jest.fn(),
        validateSync: jest.fn(),
        directModifiedPaths: jest.fn(),
      } as unknown as AccountDocument & Document;

      walletServiceMock.rechargeWallet.mockResolvedValue(mockAccountResponse);

      const result = await controller.rechargeOne(createDto, mockReq);

      expect(result).toEqual(mockAccountResponse);
      expect(walletServiceMock.rechargeWallet).toHaveBeenCalledWith(
        createDto,
        'userId',
        'test.host.com'
      );
    });
  });

  describe('withdraw', () => {
    it('should validate withdrawal request and process it', async () => {
      const userId = new mongoose.Types.ObjectId();
      const fromWalletId = new mongoose.Types.ObjectId();
      const toWalletId = new mongoose.Types.ObjectId();

      const createDto = {
        from: fromWalletId,
        to: toWalletId,
        amount: 100,
        currency: 'USD'
      } as unknown as WalletDepositCreateDto;

      jest.spyOn(CommonService, 'getUserId').mockReturnValue(userId.toString());
      accountServiceMock.findOneById.mockResolvedValue({
        owner: userId,
        _id: fromWalletId,
      } as unknown as AccountDocument);

      const mockResponse = {
        statusCode: 200,
        data: {
          txId: 'tx123',
          url: 'https://example.com/tx',
          address: 'wallet123',
          chain: 'ETH'
        }
      };

      walletServiceMock.rechargeWallet.mockResolvedValue(mockResponse);

      const result = await controller.withdraw(createDto, {
        user: { id: userId.toString() },
        get: jest.fn().mockReturnValue('test.host.com')
      });

      expect(accountServiceMock.findOneById).toHaveBeenCalledWith(fromWalletId.toString());
      expect(result).toEqual(mockResponse);
    });

    it('should throw BadRequestException if from wallet is not found', async () => {
      const userId = new mongoose.Types.ObjectId();
      const fromWalletId = new mongoose.Types.ObjectId();

      const createDto = {
        from: fromWalletId,
        to: 'toWalletId',
        amount: 100,
        currency: 'USD'
      } as unknown as WalletDepositCreateDto;

      jest.spyOn(CommonService, 'getUserId').mockReturnValue(userId.toString());
      accountServiceMock.findOneById.mockResolvedValue(null);

      await expect(controller.withdraw(createDto, {
        user: { id: userId.toString() },
        get: jest.fn().mockReturnValue('test.host.com')
      }))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException if from is missing', async () => {
      const userId = new mongoose.Types.ObjectId();

      const createDto = {
        to: 'toWalletId',
        amount: 100,
        currency: 'USD'
      } as unknown as WalletDepositCreateDto;

      jest.spyOn(CommonService, 'getUserId').mockReturnValue(userId.toString());

      await expect(controller.withdraw(createDto, {
        user: { id: userId.toString() },
        get: jest.fn().mockReturnValue('test.host.com')
      }))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException if to is missing', async () => {
      const userId = new mongoose.Types.ObjectId();
      const fromWalletId = new mongoose.Types.ObjectId();

      const createDto = {
        from: fromWalletId,
        amount: 100,
        currency: 'USD'
      } as unknown as WalletDepositCreateDto;

      jest.spyOn(CommonService, 'getUserId').mockReturnValue(userId.toString());

      await expect(controller.withdraw(createDto, {
        user: { id: userId.toString() },
        get: jest.fn().mockReturnValue('test.host.com')
      }))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException if wallet owner does not match', async () => {
      const userId = new mongoose.Types.ObjectId();
      const differentUserId = new mongoose.Types.ObjectId();
      const fromWalletId = new mongoose.Types.ObjectId();

      const createDto = {
        from: fromWalletId,
        to: 'toWalletId',
        amount: 100,
        currency: 'USD'
      } as unknown as WalletDepositCreateDto;

      jest.spyOn(CommonService, 'getUserId').mockReturnValue(userId.toString());
      accountServiceMock.findOneById.mockResolvedValue({
        owner: differentUserId,
        _id: fromWalletId,
      } as unknown as AccountDocument);

      await expect(controller.withdraw(createDto, {
        user: { id: userId.toString() },
        get: jest.fn().mockReturnValue('test.host.com')
      }))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('wallet status operations', () => {
    const walletId = 'wallet123';

    it('should lock wallet', async () => {
      await controller.blockedOneById(walletId);
      expect(walletServiceMock.updateStatusAccount).toHaveBeenCalledWith(
        walletId,
        StatusAccountEnum.LOCK
      );
    });

    it('should unlock wallet', async () => {
      await controller.unblockedOneById(walletId);
      expect(walletServiceMock.updateStatusAccount).toHaveBeenCalledWith(
        walletId,
        StatusAccountEnum.UNLOCK
      );
    });

    it('should cancel wallet', async () => {
      await controller.cancelOneById(walletId);
      expect(walletServiceMock.updateStatusAccount).toHaveBeenCalledWith(
        walletId,
        StatusAccountEnum.CANCEL
      );
    });

    it('should hide wallet', async () => {
      await controller.disableOneById(walletId);
      expect(walletServiceMock.toggleVisibleToOwner).toHaveBeenCalledWith(
        walletId,
        false
      );
    });

    it('should show wallet', async () => {
      await controller.enableOneById(walletId);
      expect(walletServiceMock.toggleVisibleToOwner).toHaveBeenCalledWith(
        walletId,
        true
      );
    });
  });

  describe('deleteOneById', () => {
    it('should throw UnauthorizedException', async () => {
      await expect(controller.deleteOneById('walletId'))
        .rejects
        .toThrow(UnauthorizedException);
    });
  });

  describe('Event handlers', () => {
    describe('migrateWallet', () => {
      it('should create new wallet if not exists', async () => {
        const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
        const mockWalletData = {
          accountId: 'wallet123',
          type: TypesAccountEnum.WALLET,
        };

        accountServiceMock.findAll.mockResolvedValue({
          list: [],
          totalElements: 0,
        } as ResponsePaginator<any>);

        await controller.migrateWallet(mockCtx, mockWalletData);

        expect(accountServiceMock.createOne).toHaveBeenCalledWith(mockWalletData);
      });

      it('should update existing wallet', async () => {
        const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
        const existingWallet = {
          _id: 'existingId',
          owner: 'oldOwner',
        };
        const mockWalletData = {
          accountId: 'wallet123',
          owner: 'newOwner',
        };

        accountServiceMock.findAll.mockResolvedValue({
          list: [existingWallet],
          totalElements: 1,
        } as ResponsePaginator<any>);

        await controller.migrateWallet(mockCtx, mockWalletData);

        expect(buildersServiceMock.emitAccountEventClient).toHaveBeenCalled();
      });
    });

    describe('sweepOmnibus', () => {
      it('should process sweep omnibus event', async () => {
        const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
        const mockData = { someData: 'value' };

        await controller.sweepOmnibus(mockCtx, mockData);

        expect(walletServiceMock.sweepOmnibus).toHaveBeenCalledWith(mockData);
      });
    });

    describe('createOneWalletEvent', () => {
      it('should process create wallet event', async () => {
        const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
        const createDto = new WalletCreateDto();

        jest.spyOn(controller, 'createOne').mockResolvedValue({ success: true });

        await controller.createOneWalletEvent(createDto, mockCtx);

        expect(controller.createOne).toHaveBeenCalledWith(createDto);
        expect(CommonService.ack).toHaveBeenCalledWith(mockCtx);
      });
      it('should handle errors during wallet creation event', async () => {
        const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
        const createDto = new WalletCreateDto();

        jest.spyOn(controller, 'createOne').mockRejectedValue(
          new Error('Creation failed')
        );

        await expect(controller.createOneWalletEvent(createDto, mockCtx))
          .rejects
          .toThrow('Creation failed');

        expect(CommonService.ack).toHaveBeenCalledWith(mockCtx);
      });
      it('should process create wallet event successfully', async () => {
        const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
        const createDto = new WalletCreateDto();
        const mockResult = { success: true };

        jest.spyOn(controller, 'createOne').mockResolvedValue(mockResult);

        const result = await controller.createOneWalletEvent(createDto, mockCtx);

        expect(CommonService.ack).toHaveBeenCalledWith(mockCtx);
        expect(controller.createOne).toHaveBeenCalledWith(createDto);
        expect(result).toEqual(mockResult);
      });
    });

  });
});