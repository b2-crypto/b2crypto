import { Test, TestingModule } from '@nestjs/testing';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { BuildersService } from '@builder/builders';
import { NotFoundException } from '@nestjs/common';
import { UserRegisterDto } from '@user/user/dto/user.register.dto';
import { UserUpdateDto } from '@user/user/dto/user.update.dto';
import { UserChangePasswordDto } from '@user/user/dto/user.change-password.dto';
import { ObjectId } from 'mongodb';
import { UserDocument } from '@user/user/entities/mongoose/user.schema';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';

describe('UserServiceController', () => {
  let controller: UserServiceController;
  let userService: UserServiceService;

  const mockUserServiceService = {
    getAll: jest.fn(),
    getOne: jest.fn(),
    newUser: jest.fn(),
    newManyUser: jest.fn(),
    updateUser: jest.fn(),
    updateManyUsers: jest.fn(),
    deleteUser: jest.fn(),
    deleteManyUsers: jest.fn(),
    changePasswordUser: jest.fn(),
    customUpdateOne: jest.fn(),
  };

  const mockBuildersService = {
    emitMessageEventClient: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserServiceController],
      providers: [
        { provide: UserServiceService, useValue: mockUserServiceService },
        { provide: BuildersService, useValue: mockBuildersService },
      ],
    }).compile();

    controller = module.get<UserServiceController>(UserServiceController);
    userService = module.get<UserServiceService>(UserServiceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result: ResponsePaginator<UserDocument> = {
        list: [{ id: '1', name: 'John Doe' } as UserDocument],
        totalElements: 1,
        nextPage: null,
        prevPage: null,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 0,
        order: [],
      };
      jest.spyOn(userService, 'getAll').mockResolvedValue(result);

      expect(await controller.findAll({})).toBe(result);
    });
  });

  describe('findOneById', () => {
    it('should return a single user', async () => {
      const result: UserDocument = {
        id: '1',
        name: 'John Doe',
      } as UserDocument;
      jest.spyOn(userService, 'getOne').mockResolvedValue(result);

      expect(await controller.findOneById('1')).toBe(result);
    });
  });

  describe('createOne', () => {
    it('should create a new user', async () => {
      const newUser: UserRegisterDto = {
        email: 'john@example.com',
        password: 'password123',
        name: 'John Doe',
        active: false,
        individual: false,
        confirmPassword: '',
        slugEmail: '',
        username: '',
        slugUsername: '',
        twoFactorQr: '',
        twoFactorSecret: '',
        twoFactorIsActive: false,
        verifyEmail: false,
      };
      const result: UserDocument = { id: '1', ...newUser } as UserDocument;
      jest.spyOn(userService, 'newUser').mockResolvedValue(result);

      expect(await controller.createOne(newUser)).toBe(result);
    });
  });

  describe('updateOne', () => {
    it('should update a user', async () => {
      const updateUser: UserUpdateDto = {
        id: '1',
        name: 'Jane Doe',
      };
      const result: UserDocument = {
        id: '1',
        name: 'Jane Doe',
      } as UserDocument;
      jest.spyOn(userService, 'updateUser').mockResolvedValue(result);

      expect(await controller.updateOne(updateUser)).toBe(result);
    });
  });

  describe('deleteOneById', () => {
    it('should delete a user', async () => {
      const result: UserDocument = {
        id: '1',
        name: 'John Doe',
        deleted: true,
      } as unknown as UserDocument;
      jest.spyOn(userService, 'deleteUser').mockResolvedValue(result);

      expect(await controller.deleteOneById('1')).toBe(result);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const changePasswordDto: UserChangePasswordDto = {
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      };
      const userId = new ObjectId('507f1f77bcf86cd799439011');
      const result: UserDocument = {
        _id: userId,
        name: 'John Doe',
      } as UserDocument;
      jest.spyOn(userService, 'changePasswordUser').mockResolvedValue(result);

      expect(await controller.changePassword(userId, changePasswordDto)).toBe(
        result,
      );
    });
  });

  describe('findOneByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'john@example.com';
      const result: ResponsePaginator<UserDocument> = {
        list: [{ id: '1', email } as UserDocument],
        totalElements: 1,
        nextPage: null,
        prevPage: null,
        lastPage: 1,
        firstPage: 1,
        currentPage: 1,
        elementsPerPage: 0,
        order: [],
      };
      jest.spyOn(userService, 'getAll').mockResolvedValue(result);

      expect(await controller.findOneByEmail(email)).toEqual({
        statusCode: 200,
        message: 'Email founded',
      });
    });

    it('should throw NotFoundException if email not found', async () => {
      const email = 'notfound@example.com';
      const emptyResult: ResponsePaginator<UserDocument> = {
        list: [],
        totalElements: 0,
        nextPage: null,
        prevPage: null,
        lastPage: 0,
        firstPage: 0,
        currentPage: 0,
        elementsPerPage: 0,
        order: [],
      };
      jest.spyOn(userService, 'getAll').mockResolvedValue(emptyResult);

      await expect(controller.findOneByEmail(email)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
