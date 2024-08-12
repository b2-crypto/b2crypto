import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { CommonService } from '@common/common';
import ActionsEnum from '@common/common/enums/ActionEnum';
import GenericServiceController from '@common/common/interfaces/controller.generic.interface';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { UpdateAnyDto } from '@common/common/models/update-any.dto';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import ResponseB2Crypto from '@response-b2crypto/response-b2crypto/models/ResponseB2Crypto';
import { UserChangePasswordDto } from '@user/user/dto/user.change-password.dto';
import { UserRegisterDto } from '@user/user/dto/user.register.dto';
import { UserUpdateDto } from '@user/user/dto/user.update.dto';
import { UserEntity } from '@user/user/entities/user.entity';
import { ObjectId } from 'mongodb';
import EventsNamesUserEnum from './enum/events.names.user.enum';
import { UserServiceService } from './user-service.service';

@ApiTags('USER')
@Controller('users')
export class UserServiceController implements GenericServiceController {
  constructor(private readonly userService: UserServiceService) {}

  @Get('all')
  // @CheckPoliciesAbility(new PolicyHandlerUserRead())
  async findAll(@Query() query: QuerySearchAnyDto) {
    return this.userService.getAll(query);
  }

  @Get('me')
  // @CheckPoliciesAbility(new PolicyHandlerUserRead())
  async findAllMe(@Req() req, @Query() query: QuerySearchAnyDto) {
    query = CommonService.getQueryWithUserId(query, req, '_id');
    return this.userService.getAll(query);
  }

  @ApiKeyCheck()
  @ApiTags('Stakey Security')
  @ApiSecurity('b2crypto-key')
  @Get('email/:userEmail')
  // @CheckPoliciesAbility(new PolicyHandlerUserRead())
  async findOneByEmail(@Param('userEmail') email: string) {
    const query = {
      where: {
        email: email,
      },
    };
    const rta = await this.userService.getAll(query);
    if (!rta.list[0]) {
      throw new NotFoundException('Email not found');
    }
    return {
      statusCode: 200,
      message: 'Email founded',
    };
  }

  @Get(':userID')
  // @CheckPoliciesAbility(new PolicyHandlerUserRead())
  async findOneById(@Param('userID') id: string) {
    return this.userService.getOne(id);
  }

  @Post()
  // @CheckPoliciesAbility(new PolicyHandlerUserCreate())
  async createOne(@Body() createUserDto: UserRegisterDto) {
    createUserDto.name =
      createUserDto.name ?? createUserDto.email.split('@')[0];
    return this.userService.newUser(createUserDto);
  }

  @Post('all')
  // @CheckPoliciesAbility(new PolicyHandlerUserCreate())
  async createMany(
    @Body(new ParseArrayPipe({ items: UserRegisterDto }))
    createUsersDto: UserRegisterDto[],
  ) {
    return this.userService.newManyUser(createUsersDto);
  }

  @Patch()
  // @CheckPoliciesAbility(new PolicyHandlerUserUpdate())
  async updateOne(@Body() updateUserDto: UserUpdateDto) {
    return this.userService.updateUser(updateUserDto);
  }

  @Patch('all')
  // @CheckPoliciesAbility(new PolicyHandlerUserUpdate())
  async updateMany(
    @Body(new ParseArrayPipe({ items: UserUpdateDto }))
    updateUsersDto: UserUpdateDto[],
  ) {
    return this.userService.updateManyUsers(updateUsersDto);
  }

  @Delete(':userID')
  // @CheckPoliciesAbility(new PolicyHandlerUserDelete())
  async deleteOneById(@Param('userID') id: string) {
    return this.userService.deleteUser(id);
  }

  @Delete('all')
  // @CheckPoliciesAbility(new PolicyHandlerUserDelete())
  async deleteManyById(
    @Body(new ParseArrayPipe({ items: UserUpdateDto }))
    ids: UserUpdateDto[],
  ) {
    return this.userService.deleteManyUsers(ids.map((user) => user.id));
  }

  @Patch('change-password/:userID')
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(200, ActionsEnum.UPDATE))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  async changePassword(
    @Param('userID') id: ObjectId,
    @Body() changePasswordUserDto: UserChangePasswordDto,
  ) {
    return this.userService.changePasswordUser(id, changePasswordUserDto);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesUserEnum.findAll)
  findAllEvent(@Payload() query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.findAll(query);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesUserEnum.findOneById)
  findOneByIdEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.findOneById(id);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesUserEnum.findOneByApiKey)
  findOneByPublicKeyEvent(
    @Payload() publicKey: string,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.findOneByApiKey(publicKey);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesUserEnum.createOne)
  async createOneEvent(
    @Payload() createDto: UserRegisterDto,
    @Ctx() ctx: RmqContext,
  ) {
    try {
      const user = await this.createOne(createDto);
      CommonService.ack(ctx);
      return user;
    } catch (err) {
      CommonService.ack(ctx);
      //throw new RpcException(err);
      return {
        data: err,
        message: err.errmsg,
        statusCode: err.statusCode,
      };
    }
  }

  @AllowAnon()
  @MessagePattern(EventsNamesUserEnum.migrateOne)
  async migrateOne(
    @Payload() createDto: UserRegisterDto,
    @Ctx() ctx: RmqContext,
  ) {
    try {
      let user: any;
      const users = await this.findAll({
        where: {
          email: createDto.email,
        },
      });
      if (users?.list?.length > 0) {
        user = users.list[0];
      } else {
        user = await this.createOne(createDto);
      }
      CommonService.ack(ctx);
      return user;
    } catch (err) {
      CommonService.ack(ctx);
      //throw new RpcException(err);
      return {
        data: err,
        message: err.errmsg,
        statusCode: err.statusCode,
      };
    }
  }

  @AllowAnon()
  @MessagePattern(EventsNamesUserEnum.createMany)
  createManyEvent(
    @Payload() createsDto: UserRegisterDto[],
    @Ctx() ctx: RmqContext,
  ) {
    const user = this.createMany(createsDto);
    CommonService.ack(ctx);
    return user;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesUserEnum.updateOne)
  @EventPattern(EventsNamesUserEnum.updateOne)
  updateOneEvent(@Payload() updateDto: UserUpdateDto, @Ctx() ctx: RmqContext) {
    const user = this.updateOne(updateDto);
    CommonService.ack(ctx);
    return user;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesUserEnum.updateMany)
  updateManyEvent(
    @Payload() updatesDto: UserUpdateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    const user = this.updateMany(updatesDto);
    CommonService.ack(ctx);
    return user;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesUserEnum.deleteMany)
  deleteManyByIdEvent(@Payload() ids: UpdateAnyDto[], @Ctx() ctx: RmqContext) {
    const user = this.deleteManyById(ids);
    CommonService.ack(ctx);
    return user;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesUserEnum.deleteOneById)
  deleteOneByIdEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    const user = this.deleteOneById(id);
    CommonService.ack(ctx);
    return user;
  }

  @AllowAnon()
  @EventPattern(EventsNamesUserEnum.activeTwoFactor)
  async activeTwoFactor(@Payload() user: UserEntity) {
    await this.userService.updateUser({
      id: user.id,
      twoFactorIsActive: true,
    });
  }

  private async findOneByApiKey(publicKey: string) {
    const users = await this.userService.getAll({
      where: {
        apiKey: publicKey,
      },
    });
    if (!users.totalElements) {
      throw new NotFoundException();
    }
    return users.list[0];
  }
}
