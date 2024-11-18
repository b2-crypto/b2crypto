import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WalletServiceController } from './wallet-service.controller';
import { AccountServiceService } from './account-service.service';
import { UserServiceService } from '../../user-service/src/user-service.service';
import { BuildersService } from '@builder/builders';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { User, UserDocument } from '@user/user/entities/mongoose/user.schema';
import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import { WalletDepositCreateDto } from '@account/account/dto/wallet-deposit.create.dto';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import mongoose from 'mongoose';
import { CommonService } from '@common/common';
import { WalletServiceService } from './wallet-service.service';
import { RmqContext } from '@nestjs/microservices';

jest.mock('@common/common');

describe('WalletServiceController', () => {
  let controller: WalletServiceController;
  let accountServiceMock: jest.Mocked<AccountServiceService>;
  let buildersServiceMock: jest.Mocked<BuildersService>;
  let userServiceMock: jest.Mocked<UserServiceService>;
  let configServiceMock: jest.Mocked<ConfigService>;
  let walletServiceMock: jest.Mocked<WalletServiceService>;

  beforeEach(async () => {
    accountServiceMock = {
      findAll: jest.fn(),
      createOne: jest.fn(),
      findOneById: jest.fn(),
      customUpdateOne: jest.fn(),
    } as any;
    buildersServiceMock = {
      emitMessageEventClient: jest.fn(),
      emitAccountEventClient: jest.fn(),
      getPromiseTransferEventClient: jest.fn(),
      emitTransferEventClient: jest.fn(),
      getPromiseCategoryEventClient: jest.fn(),
      getPromiseStatusEventClient: jest.fn(),
      getPromisePspAccountEventClient: jest.fn(),
    } as any;
    userServiceMock = {
      getAll: jest.fn(),
    } as any;
    configServiceMock = {
      get: jest.fn(),
    } as any;
    walletServiceMock = {
      createWallet: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletServiceController],
      providers: [
        { provide: AccountServiceService, useValue: accountServiceMock },
        { provide: BuildersService, useValue: buildersServiceMock },
        { provide: UserServiceService, useValue: userServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: WalletServiceService, useValue: walletServiceMock },
      ],
    }).compile();

    controller = module.get<WalletServiceController>(WalletServiceController);
  });

  describe('findAll', () => {
    it('should return all wallets', async () => {
      const mockWallets: ResponsePaginator<AccountDocument> = {
        list: [{ type: TypesAccountEnum.WALLET } as AccountDocument],
        totalElements: 1,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: [],
      };
      accountServiceMock.findAll.mockResolvedValue(mockWallets);

      const mockReq = { clientApi: {} };
      const result = await controller.findAll({}, mockReq);

      expect(result).toEqual(mockWallets);
      expect(accountServiceMock.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: TypesAccountEnum.WALLET },
        }),
      );
    });
  });

  describe('createOne', () => {
    it('should create a wallet using walletServiceService', async () => {
      const createDto = new WalletCreateDto();
      const mockUserId = new mongoose.Types.ObjectId().toString();
      const mockReq = { user: { id: mockUserId } };
      const mockCreatedWallet = { _id: new mongoose.Types.ObjectId() };

      walletServiceMock.createWallet.mockResolvedValue(mockCreatedWallet);

      const result = await controller.createOne(createDto, mockReq);

      expect(result).toEqual(mockCreatedWallet);
      expect(walletServiceMock.createWallet).toHaveBeenCalledWith(
        createDto,
        mockUserId,
      );
    });
  });

  describe('rechargeOne', () => {
    it('should throw BadRequestException if amount is less than or equal to 10', async () => {
      const createDto = new WalletDepositCreateDto();
      createDto.amount = 10;
      createDto.from =
        new mongoose.Types.ObjectId() as unknown as mongoose.Schema.Types.ObjectId;
      createDto.to =
        new mongoose.Types.ObjectId() as unknown as mongoose.Schema.Types.ObjectId;

      const mockUserId = new mongoose.Types.ObjectId();
      const mockReq = {
        user: { id: mockUserId.toString() },
        get: jest.fn().mockReturnValue('test.com'),
      };

      await expect(
        controller.rechargeOne(createDto, mockReq as any),
      ).rejects.toThrow(BadRequestException);

      expect(userServiceMock.getAll).not.toHaveBeenCalled();
    });

    it('should call walletServiceService.rechargeWallet if amount is greater than 10', async () => {
      const createDto = new WalletDepositCreateDto();
      createDto.amount = 11;
      createDto.from =
        new mongoose.Types.ObjectId() as unknown as mongoose.Schema.Types.ObjectId;
      createDto.to =
        new mongoose.Types.ObjectId() as unknown as mongoose.Schema.Types.ObjectId;

      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser: UserDocument = {
        _id: mockUserId,
        personalData: { firstName: 'John', lastName: 'Doe' },
        email: 'test@example.com',
      } as unknown as UserDocument;

      const mockUserResponse: ResponsePaginator<UserDocument> = {
        list: [mockUser],
        totalElements: 1,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: [],
      };

      userServiceMock.getAll.mockResolvedValue(mockUserResponse);

      const mockReq = {
        user: { id: mockUserId.toString() },
        get: jest.fn().mockReturnValue('test.com'),
      };

      // Mock the rechargeWallet method
      const mockRechargeWallet = jest.fn().mockResolvedValue({ success: true });
      (controller as any).walletServiceService = {
        rechargeWallet: mockRechargeWallet,
      };

      await controller.rechargeOne(createDto, mockReq as any);

      expect(mockRechargeWallet).toHaveBeenCalledWith(
        createDto,
        mockUserId.toString(),
        'test.com',
      );
    });
  });

  describe('blockedOneById', () => {
    it('should block a wallet', async () => {
      const mockWalletId = new mongoose.Types.ObjectId().toString();
      jest
        .spyOn(controller as any, 'updateStatusAccount')
        .mockResolvedValue({});

      await controller.blockedOneById(mockWalletId);

      expect(controller['updateStatusAccount']).toHaveBeenCalledWith(
        mockWalletId,
        StatusAccountEnum.LOCK,
      );
    });
  });

  describe('unblockedOneById', () => {
    it('should unblock a wallet', async () => {
      const mockWalletId = new mongoose.Types.ObjectId().toString();
      jest
        .spyOn(controller as any, 'updateStatusAccount')
        .mockResolvedValue({});

      await controller.unblockedOneById(mockWalletId);

      expect(controller['updateStatusAccount']).toHaveBeenCalledWith(
        mockWalletId,
        StatusAccountEnum.UNLOCK,
      );
    });
  });

  describe('cancelOneById', () => {
    it('should cancel a wallet', async () => {
      const mockWalletId = new mongoose.Types.ObjectId().toString();
      jest
        .spyOn(controller as any, 'updateStatusAccount')
        .mockResolvedValue({});

      await controller.cancelOneById(mockWalletId);

      expect(controller['updateStatusAccount']).toHaveBeenCalledWith(
        mockWalletId,
        StatusAccountEnum.CANCEL,
      );
    });
  });

  describe('disableOneById', () => {
    it('should disable a wallet', async () => {
      const mockWalletId = new mongoose.Types.ObjectId().toString();
      jest
        .spyOn(controller as any, 'toggleVisibleToOwner')
        .mockResolvedValue({});

      await controller.disableOneById(mockWalletId);

      expect(controller['toggleVisibleToOwner']).toHaveBeenCalledWith(
        mockWalletId,
        false,
      );
    });
  });

  describe('enableOneById', () => {
    it('should enable a wallet', async () => {
      const mockWalletId = new mongoose.Types.ObjectId().toString();
      jest
        .spyOn(controller as any, 'toggleVisibleToOwner')
        .mockResolvedValue({});

      await controller.enableOneById(mockWalletId);

      expect(controller['toggleVisibleToOwner']).toHaveBeenCalledWith(
        mockWalletId,
        true,
      );
    });
  });

  describe('migrateWallet', () => {
    it('should migrate a wallet successfully', async () => {
      const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
      const mockWalletToMigrate = {
        accountId: 'walletId',
        type: TypesAccountEnum.WALLET,
      };

      accountServiceMock.findAll.mockResolvedValue({
        list: [],
        totalElements: 0,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: [],
      } as ResponsePaginator<AccountDocument>);

      const mockCreatedWallet = {
        _id: new mongoose.Types.ObjectId(),
      } as AccountDocument;
      accountServiceMock.createOne.mockResolvedValue(mockCreatedWallet);

      const result = await controller.migrateWallet(
        mockCtx,
        mockWalletToMigrate,
      );

      expect(result).toEqual(mockCreatedWallet);
      expect(accountServiceMock.createOne).toHaveBeenCalledWith(
        mockWalletToMigrate,
      );
    });

    it('should update existing wallet if found', async () => {
      const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
      const mockWalletToMigrate = {
        accountId: 'walletId',
        type: TypesAccountEnum.WALLET,
        owner: 'newOwnerId',
      };

      const existingWallet = {
        _id: new mongoose.Types.ObjectId(),
        owner: 'oldOwnerId',
      } as unknown as AccountDocument;
      accountServiceMock.findAll.mockResolvedValue({
        list: [existingWallet],
        totalElements: 1,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: [],
      } as ResponsePaginator<AccountDocument>);

      const result = await controller.migrateWallet(
        mockCtx,
        mockWalletToMigrate,
      );

      expect(result).toEqual(expect.objectContaining({ owner: 'newOwnerId' }));
      expect(buildersServiceMock.emitAccountEventClient).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: existingWallet._id,
          owner: 'newOwnerId',
        }),
      );
    });
  });

  describe('createOneWalletEvent', () => {
    it('should create a wallet from an event', async () => {
      const createDto = new WalletCreateDto();
      const mockCtx = { ack: jest.fn() } as unknown as RmqContext;
      const mockCreatedWallet = { _id: new mongoose.Types.ObjectId() };

      jest
        .spyOn(controller, 'createOne')
        .mockResolvedValue(mockCreatedWallet as any);
      jest.spyOn(CommonService, 'ack').mockImplementation();

      const result = await controller.createOneWalletEvent(createDto, mockCtx);

      expect(result).toEqual(mockCreatedWallet);
      expect(CommonService.ack).toHaveBeenCalledWith(mockCtx);
      expect(controller.createOne).toHaveBeenCalledWith(createDto);
    });
  });
});
