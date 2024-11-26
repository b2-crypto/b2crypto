import { Test, TestingModule } from '@nestjs/testing';
import { BankServiceController } from './bank-service.controller';
import { BankServiceService } from './bank-service.service';
import { BadRequestException } from '@nestjs/common';
import { BankCreateDto } from '@account/account/dto/bank.create.dto';
import { BankDepositCreateDto } from '@account/account/dto/bank-deposit.create.dto';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import mongoose from 'mongoose';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { User } from '@user/user/entities/mongoose/user.schema';

describe('BankServiceController', () => {
  let controller: BankServiceController;
  let bankServiceMock: jest.Mocked<BankServiceService>;

  beforeEach(async () => {
    bankServiceMock = {
      findAll: jest.fn(),
      findAllMe: jest.fn(),
      createOne: jest.fn(),
      depositOne: jest.fn(),
      deleteOneById: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankServiceController],
      providers: [{ provide: BankServiceService, useValue: bankServiceMock }],
    }).compile();

    controller = module.get<BankServiceController>(BankServiceController);
  });

  describe('findAll', () => {
    it('should return all bank accounts', async () => {
      const query: QuerySearchAnyDto = {};
      const mockBankAccounts: ResponsePaginator<AccountDocument> = {
        list: [
          {
            _id: new mongoose.Types.ObjectId(),
            type: 'BANK',
          } as AccountDocument,
        ],
        totalElements: 1,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: [],
      };
      bankServiceMock.findAll.mockResolvedValue(mockBankAccounts);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockBankAccounts);
      expect(bankServiceMock.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findAllMe', () => {
    it('should return all bank accounts for the user', async () => {
      const query: QuerySearchAnyDto = {};
      const mockReq = { user: { id: '123' } };
      const mockBankAccounts: ResponsePaginator<AccountDocument> = {
        list: [
          {
            _id: new mongoose.Types.ObjectId(),
            type: 'BANK',
            owner: '123',
          } as unknown as AccountDocument,
        ],
        totalElements: 1,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: [],
      };
      bankServiceMock.findAllMe.mockResolvedValue(mockBankAccounts);

      const result = await controller.findAllMe(query, mockReq);

      expect(result).toEqual(mockBankAccounts);
      expect(bankServiceMock.findAllMe).toHaveBeenCalledWith(query, mockReq);
    });
  });

  describe('createOne', () => {
    it('should create a bank account when valid data is provided', async () => {
      const createDto = new BankCreateDto();
      const mockReq = { user: { id: '123' } };
      const mockCreatedAccount: AccountDocument = {
        _id: new mongoose.Types.ObjectId(),
        type: 'BANK',
        owner: '123',
      } as unknown as AccountDocument;

      bankServiceMock.createOne.mockResolvedValue(mockCreatedAccount);

      const result = await controller.createOne(createDto, mockReq);

      expect(result).toEqual(mockCreatedAccount);
      expect(bankServiceMock.createOne).toHaveBeenCalledWith(
        createDto,
        mockReq,
      );
    });
  });

  describe('depositOne', () => {
    it('should deposit to a bank account successfully', async () => {
      const createDto = new BankDepositCreateDto();
      const mockReq = { user: { id: '123' } };
      const mockDepositResult: AccountDocument = {
        _id: new mongoose.Types.ObjectId(),
        type: 'BANK',
        owner: '123',
        balance: 1000,
      } as unknown as AccountDocument;

      bankServiceMock.depositOne.mockResolvedValue(mockDepositResult);

      const result = await controller.depositOne(createDto, mockReq);

      expect(result).toEqual(mockDepositResult);
      expect(bankServiceMock.depositOne).toHaveBeenCalledWith(
        createDto,
        mockReq,
      );
    });
  });

  describe('deleteOneById', () => {
    it('should delete a bank account', async () => {
      const mockBankAccountId = new mongoose.Types.ObjectId().toString();
      const mockDeletedAccount: AccountDocument = {
        _id: new mongoose.Types.ObjectId(),
        type: 'BANK',
        owner: '123',
      } as unknown as AccountDocument;

      bankServiceMock.deleteOneById.mockResolvedValue(
        mockDeletedAccount as AccountDocument,
      );

      const result = await controller.deleteOneById(mockBankAccountId);

      expect(result).toEqual(mockDeletedAccount);
      expect(bankServiceMock.deleteOneById).toHaveBeenCalledWith(
        mockBankAccountId,
      );
    });
  });
});
