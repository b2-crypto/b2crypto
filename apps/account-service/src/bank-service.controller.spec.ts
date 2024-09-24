import { Test, TestingModule } from '@nestjs/testing';
import { BankServiceController } from './bank-service.controller';
import { AccountServiceService } from './account-service.service';
import { UserServiceService } from '../../user-service/src/user-service.service';
import { CategoryServiceService } from '../../category-service/src/category-service.service';
import { StatusServiceService } from '../../status-service/src/status-service.service';
import { GroupServiceService } from '../../group-service/src/group-service.service';
import { BuildersService } from '@builder/builders';
import { IntegrationService } from '@integration/integration';
import { BadRequestException } from '@nestjs/common';
import { User, UserDocument } from '@user/user/entities/mongoose/user.schema';
import { BankCreateDto } from '@account/account/dto/bank.create.dto';
import { BankDepositCreateDto } from '@account/account/dto/bank-deposit.create.dto';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import mongoose from 'mongoose';
import { CommonService } from '@common/common';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import DocIdTypeEnum from '@common/common/enums/DocIdTypeEnum';
import GenderEnum from '@common/common/enums/GenderEnum';
import { JobSchema } from '@person/person/entities/mongoose/job.schema';
import { KyCSchema } from '@person/person/entities/mongoose/kyc.schema';
import { LocationSchema } from '@person/person/entities/mongoose/location.schema';

describe('BankServiceController', () => {
  let controller: BankServiceController;
  let accountServiceMock: jest.Mocked<AccountServiceService>;
  let userServiceMock: jest.Mocked<UserServiceService>;
  let categoryServiceMock: jest.Mocked<CategoryServiceService>;
  let statusServiceMock: jest.Mocked<StatusServiceService>;
  let groupServiceMock: jest.Mocked<GroupServiceService>;
  let buildersServiceMock: jest.Mocked<BuildersService>;
  let integrationServiceMock: jest.Mocked<IntegrationService>;

  beforeEach(async () => {
    accountServiceMock = {
      findAll: jest.fn(),
      createOne: jest.fn(),
      findOneById: jest.fn(),
      customUpdateOne: jest.fn(),
      deleteOneById: jest.fn(),
    } as any;
    userServiceMock = {
      getAll: jest.fn(),
    } as any;
    categoryServiceMock = {} as any;
    statusServiceMock = {} as any;
    groupServiceMock = {} as any;
    buildersServiceMock = {} as any;
    integrationServiceMock = {} as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankServiceController],
      providers: [
        { provide: AccountServiceService, useValue: accountServiceMock },
        { provide: UserServiceService, useValue: userServiceMock },
        { provide: CategoryServiceService, useValue: categoryServiceMock },
        { provide: StatusServiceService, useValue: statusServiceMock },
        { provide: GroupServiceService, useValue: groupServiceMock },
        { provide: BuildersService, useValue: buildersServiceMock },
        { provide: IntegrationService, useValue: integrationServiceMock },
      ],
    }).compile();

    controller = module.get<BankServiceController>(BankServiceController);
  });

  describe('findAll', () => {
    it('should return all bank accounts', async () => {
      const query: QuerySearchAnyDto = {};
      const mockBankAccounts: ResponsePaginator<AccountDocument> = {
        list: [{ type: TypesAccountEnum.BANK } as AccountDocument],
        totalElements: 1,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: []
      };
      accountServiceMock.findAll.mockResolvedValue(mockBankAccounts);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockBankAccounts);
      expect(accountServiceMock.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { type: TypesAccountEnum.BANK }
      }));
    });
  });

  describe('findAllMe', () => {
    it('should return all bank accounts for the user', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const query: QuerySearchAnyDto = {};
      const mockReq = { user: { id: mockUserId.toString() } };
      const mockBankAccounts: ResponsePaginator<AccountDocument> = {
        list: [{ type: TypesAccountEnum.BANK, owner: mockUserId } as unknown as AccountDocument],
        totalElements: 1,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: []
      };
      accountServiceMock.findAll.mockResolvedValue(mockBankAccounts);

      const result = await controller.findAllMe(query, mockReq);

      expect(result).toEqual(mockBankAccounts);
      expect(accountServiceMock.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { type: TypesAccountEnum.BANK, owner: mockUserId }
      }));
    });
  });

  describe('createOne', () => {
    it('should create a bank account when valid data is provided', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const createDto = new BankCreateDto();
      const mockReq = { user: { id: mockUserId.toString() } };
      
      const mockUser: Partial<UserDocument> = {
        _id: mockUserId,
        id: mockUserId.toString(),
        personalData: {
            id: undefined,
            name: '',
            slug: '',
            description: '',
            searchText: '',
            lastName: '',
            email: [],
            nationality: CountryCodeEnum.na,
            country: CountryCodeEnum.na,
            taxIdentificationType: '',
            taxIdentificationValue: 0,
            telephones: [],
            phoneNumber: '',
            numDocId: '',
            typeDocId: DocIdTypeEnum.CEDULA_CIUDADANIA,
            location: new LocationSchema,
            job: new JobSchema,
            birth: undefined,
            gender: GenderEnum.MALE,
            kyc: new KyCSchema,
            user: new User,
            leads: [],
            traffics: [],
            affiliates: [],
            createdAt: undefined,
            updatedAt: undefined
        },
      };

      const mockUserResponse: ResponsePaginator<UserDocument> = {
        list: [mockUser as UserDocument],
        totalElements: 1,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: []
      };

      userServiceMock.getAll.mockResolvedValue(mockUserResponse);

      const mockCreatedAccount = {
        _id: new mongoose.Types.ObjectId(),
      };

      accountServiceMock.createOne.mockResolvedValue(mockCreatedAccount as AccountDocument);

      jest.spyOn(CommonService, 'randomIntNumber').mockReturnValue(1234);
      jest.spyOn(CommonService, 'getUserId').mockReturnValue(mockUserId.toString());

      const result = await controller.createOne(createDto, mockReq);

      expect(result).toEqual(mockCreatedAccount);
      expect(accountServiceMock.createOne).toHaveBeenCalledWith(expect.objectContaining({
        owner: mockUserId.toString(),
        pin: 1234,
      }));
    });

    it('should throw BadRequestException when user has no personal data', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const createDto = new BankCreateDto();
      const mockReq = { user: { id: mockUserId.toString() } };
      
      const mockUser: Partial<UserDocument> = {
        _id: mockUserId,
        id: mockUserId.toString(),
        personalData: null,
      };

      const mockUserResponse: ResponsePaginator<UserDocument> = {
        list: [mockUser as UserDocument],
        totalElements: 1,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: []
      };

      userServiceMock.getAll.mockResolvedValue(mockUserResponse);
      jest.spyOn(CommonService, 'getUserId').mockReturnValue(mockUserId.toString());

      await expect(controller.createOne(createDto, mockReq)).rejects.toThrow(BadRequestException);
    });
  });

  describe('depositOne', () => {
    it('should deposit to a bank account successfully', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser: Partial<UserDocument> = {
        _id: mockUserId,
        id: mockUserId.toString(),
        personalData: {
            id: undefined,
            name: '',
            slug: '',
            description: '',
            searchText: '',
            lastName: '',
            email: [],
            nationality: CountryCodeEnum.na,
            country: CountryCodeEnum.na,
            taxIdentificationType: '',
            taxIdentificationValue: 0,
            telephones: [],
            phoneNumber: '',
            numDocId: '',
            typeDocId: DocIdTypeEnum.CEDULA_CIUDADANIA,
            location: new LocationSchema,
            job: new JobSchema,
            birth: undefined,
            gender: GenderEnum.MALE,
            kyc: new KyCSchema,
            user: new User,
            leads: [],
            traffics: [],
            affiliates: [],
            createdAt: undefined,
            updatedAt: undefined
        },
      };

      const mockUserResponse: ResponsePaginator<UserDocument> = {
        list: [mockUser as UserDocument],
        totalElements: 1,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: []
      };

      userServiceMock.getAll.mockResolvedValue(mockUserResponse);

      const mockBankAccount = { _id: new mongoose.Types.ObjectId(), type: TypesAccountEnum.BANK } as AccountDocument;
      const mockWallet = { _id: new mongoose.Types.ObjectId(), type: TypesAccountEnum.WALLET, amount: 100 } as AccountDocument;
      
      accountServiceMock.findOneById.mockResolvedValueOnce(mockBankAccount);
      accountServiceMock.findOneById.mockResolvedValueOnce(mockWallet);
      accountServiceMock.customUpdateOne.mockResolvedValue({} as AccountDocument);

      const createDto = new BankDepositCreateDto();
      createDto.id = mockBankAccount._id;
      createDto.from = mockWallet._id;
      createDto.amount = 50;

      const mockReq = { user: { id: mockUserId.toString() } };

      await controller.depositOne(createDto, mockReq);

      expect(accountServiceMock.customUpdateOne).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if amount is 0 or less', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser: Partial<UserDocument> = {
        _id: mockUserId,
        id: mockUserId.toString(),
        personalData: {
            id: undefined,
            name: '',
            slug: '',
            description: '',
            searchText: '',
            lastName: '',
            email: [],
            nationality: CountryCodeEnum.na,
            country: CountryCodeEnum.na,
            taxIdentificationType: '',
            taxIdentificationValue: 0,
            telephones: [],
            phoneNumber: '',
            numDocId: '',
            typeDocId: DocIdTypeEnum.CEDULA_CIUDADANIA,
            location: new LocationSchema,
            job: new JobSchema,
            birth: undefined,
            gender: GenderEnum.MALE,
            kyc: new KyCSchema,
            user: new User,
            leads: [],
            traffics: [],
            affiliates: [],
            createdAt: undefined,
            updatedAt: undefined
        },
      };

      const mockUserResponse: ResponsePaginator<UserDocument> = {
        list: [mockUser as UserDocument],
        totalElements: 1,
        nextPage: 1,
        prevPage: 1,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 10,
        order: []
      };

      userServiceMock.getAll.mockResolvedValue(mockUserResponse);

      const createDto = new BankDepositCreateDto();
      createDto.amount = 0;

      const mockReq = { user: { id: mockUserId.toString() } };

      await expect(controller.depositOne(createDto, mockReq)).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteOneById', () => {
    it('should delete a bank account', async () => {
      const mockBankAccountId = new mongoose.Types.ObjectId().toString();
      accountServiceMock.deleteOneById.mockResolvedValue({} as any);

      await controller.deleteOneById(mockBankAccountId);

      expect(accountServiceMock.deleteOneById).toHaveBeenCalledWith(mockBankAccountId);
    });
  });
});