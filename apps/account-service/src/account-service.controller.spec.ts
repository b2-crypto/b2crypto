import { Test, TestingModule } from '@nestjs/testing';
import { AccountServiceController } from './account-service.controller';
import { AccountServiceService } from './account-service.service';
import { BuildersService } from '@builder/builders';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { RmqContext } from '@nestjs/microservices';
import { CommonService } from '@common/common';
import EventsNamesAccountEnum from './enum/events.names.account.enum';
import { AccountCreateDto } from '@account/account/dto/account.create.dto';
import { AccountUpdateDto } from '@account/account/dto/account.update.dto';
import { UpdateAnyDto } from '@common/common/models/update-any.dto';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('@common/common');

describe('AccountServiceController', () => {
  let controller: AccountServiceController;
  let accountServiceMock: jest.Mocked<AccountServiceService>;
  let buildersServiceMock: jest.Mocked<BuildersService>;

  beforeEach(async () => {
    accountServiceMock = {
      findAll: jest.fn(),
      findOneById: jest.fn(),
      createOne: jest.fn(),
      createMany: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      deleteManyById: jest.fn(),
      deleteOneById: jest.fn(),
      count: jest.fn(),
      createOneEvent: jest.fn(),
      createManyEvent: jest.fn(),
      updateOneEvent: jest.fn(),
      updateManyEvent: jest.fn(),
      deleteManyByIdEvent: jest.fn(),
      deleteOneByIdEvent: jest.fn(),
      customUpdateOne: jest.fn(),
    } as any;

    buildersServiceMock = {
      getPromiseStatusEventClient: jest.fn(),
      getPromiseUserEventClient: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountServiceController],
      providers: [
        { provide: AccountServiceService, useValue: accountServiceMock },
        { provide: BuildersService, useValue: buildersServiceMock },
      ],
    }).compile();

    controller = module.get<AccountServiceController>(AccountServiceController);
  });

  describe('findAll', () => {
    it('should call accountService.findAll with the provided query', async () => {
      const mockQuery: QuerySearchAnyDto = {};
      await controller.findAll(mockQuery);
      expect(accountServiceMock.findAll).toHaveBeenCalledWith(mockQuery);
    });
  });

  describe('findAllMe', () => {
    it('should call accountService.findAll with user-specific query', async () => {
      const mockQuery: QuerySearchAnyDto = {};
      const mockReq = { user: { id: 'userId' } };
      const expectedQuery = { where: { owner: 'userId' } };
      jest.spyOn(CommonService, 'getQueryWithUserId').mockReturnValue(expectedQuery);
      await controller.findAllMe(mockQuery, mockReq);
      expect(accountServiceMock.findAll).toHaveBeenCalledWith(expectedQuery);
    });
  });

  describe('findOneById', () => {
    it('should call accountService.findOneById with the provided id', async () => {
      const mockId = 'testId';
      await controller.findOneById(mockId);
      expect(accountServiceMock.findOneById).toHaveBeenCalledWith(mockId);
    });
  });

  describe('createOne', () => {
    it('should call accountService.createOne with the provided dto', async () => {
      const mockDto = {} as AccountCreateDto;
      await controller.createOne(mockDto);
      expect(accountServiceMock.createOne).toHaveBeenCalledWith(mockDto);
    });
  });

  describe('updateOne', () => {
    it('should call accountService.updateOne with the provided dto', async () => {
      const mockDto = {} as AccountUpdateDto;
      await controller.updateOne(mockDto);
      expect(accountServiceMock.updateOne).toHaveBeenCalledWith(mockDto);
    });
  });

  describe('deleteManyById', () => {
    it('should throw UnauthorizedException and not call the service', () => {
      const mockIds = [{ id: 'testId' }] as UpdateAnyDto[];
      
      expect(() => controller.deleteManyById(mockIds)).toThrow(UnauthorizedException);
      
      expect(accountServiceMock.deleteManyById).not.toHaveBeenCalled();
    });
  });

  describe('deleteOneById', () => {
    it('should throw UnauthorizedException and not call the service', () => {
      const mockId = 'testId';
      
      expect(() => controller.deleteOneById(mockId)).toThrow(UnauthorizedException);
      
      expect(accountServiceMock.deleteOneById).not.toHaveBeenCalled();
    });
  });

  describe('countEvent', () => {
    it('should call accountService.count with the provided query', async () => {
      const mockQuery: QuerySearchAnyDto = {};
      const mockContext: RmqContext = {} as RmqContext;
      await controller.countEvent(mockQuery, mockContext);
      expect(CommonService.ack).toHaveBeenCalledWith(mockContext);
      expect(accountServiceMock.count).toHaveBeenCalledWith(mockQuery, mockContext);
    });
  });

  describe('findAllEvent', () => {
    it('should call accountService.findAll with the provided query', async () => {
      const mockQuery: QuerySearchAnyDto = {};
      const mockContext: RmqContext = {} as RmqContext;
      await controller.findAllEvent(mockQuery, mockContext);
      expect(CommonService.ack).toHaveBeenCalledWith(mockContext);
      expect(accountServiceMock.findAll).toHaveBeenCalledWith(mockQuery, mockContext);
    });
  });

  describe('createOneEvent', () => {
    it('should call accountService.createOneEvent with the provided dto', async () => {
      const mockDto = {} as AccountCreateDto;
      const mockContext: RmqContext = {} as RmqContext;
      await controller.createOneEvent(mockDto, mockContext);
      expect(CommonService.ack).toHaveBeenCalledWith(mockContext);
      expect(accountServiceMock.createOneEvent).toHaveBeenCalledWith(mockDto, mockContext);
    });
  });

  describe('updateOneEvent', () => {
    it('should call accountService.updateOneEvent with the provided dto', async () => {
      const mockDto = {} as AccountCreateDto;
      const mockContext: RmqContext = {} as RmqContext;
      await controller.updateOneEvent(mockDto, mockContext);
      expect(CommonService.ack).toHaveBeenCalledWith(mockContext);
      expect(accountServiceMock.updateOneEvent).toHaveBeenCalledWith(mockDto, mockContext);
    });
  });

  describe('customUpdateOneEvent', () => {
    it('should call accountService.customUpdateOne with the provided dto', async () => {
      const mockDto = {} as AccountCreateDto;
      const mockContext: RmqContext = {} as RmqContext;
      await controller.customUpdateOneEvent(mockDto, mockContext);
      expect(CommonService.ack).toHaveBeenCalledWith(mockContext);
      expect(accountServiceMock.customUpdateOne).toHaveBeenCalledWith(mockDto);
    });
  });

  describe('toggleVisibleToOwner', () => {
    it('should toggle the visibility of an account', async () => {
      const mockId = 'testId';
      const mockAccount = { showToOwner: false, save: jest.fn() };
      accountServiceMock.findOneById.mockResolvedValue(mockAccount as any);
      
      await controller.toggleVisibleToOwner(mockId, true);
      
      expect(accountServiceMock.findOneById).toHaveBeenCalledWith(mockId);
      expect(mockAccount.showToOwner).toBe(true);
      expect(mockAccount.save).toHaveBeenCalled();
    });
  });

  describe('updateStatusAccount', () => {
    it('should update the status of an account', async () => {
      const mockId = 'testId';
      const mockSlugName = StatusAccountEnum.LOCK;
      const mockAccount = { status: null, statusText: '', save: jest.fn() };
      const mockStatus = { _id: 'statusId' };
      
      accountServiceMock.findOneById.mockResolvedValue(mockAccount as any);
      buildersServiceMock.getPromiseStatusEventClient.mockResolvedValue(mockStatus);
      
      await controller.updateStatusAccount(mockId, mockSlugName);
      
      expect(accountServiceMock.findOneById).toHaveBeenCalledWith(mockId);
      expect(buildersServiceMock.getPromiseStatusEventClient).toHaveBeenCalledWith(
        expect.anything(),
        mockSlugName
      );
      expect(mockAccount.status).toBe(mockStatus);
      expect(mockAccount.statusText).toBe(mockSlugName);
      expect(mockAccount.save).toHaveBeenCalled();
    });
  });
});