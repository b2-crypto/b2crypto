import {
  BadRequestException,
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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
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
import { isBoolean } from 'class-validator';
import { SwaggerSteakeyConfigEnum } from 'libs/config/enum/swagger.stakey.config.enum';
import { ObjectId } from 'mongodb';
import EventsNamesUserEnum from './enum/events.names.user.enum';
import { UserServiceService } from './user-service.service';
import { UserLevelUpDto } from '@user/user/dto/user.level.up.dto';

@ApiTags('USER')
@Controller('users')
export class UserServiceController implements GenericServiceController {
  constructor(private readonly userService: UserServiceService) {}

  @NoCache()
  @Get('all')
  // @CheckPoliciesAbility(new PolicyHandlerUserRead())
  async findAll(@Query() query: QuerySearchAnyDto) {
    return this.userService.getAll(query);
  }

  @NoCache()
  @Get('me')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_SECURITY)
  @ApiBearerAuth('bearerToken')
  @ApiSecurity('b2crypto-key')
  @UseGuards(ApiKeyAuthGuard)
  // @CheckPoliciesAbility(new PolicyHandlerUserRead())
  async findAllMe(@Req() req, @Query() query: QuerySearchAnyDto) {
    query = CommonService.getQueryWithUserId(query, req, '_id');
    return this.userService.getAll(query);
  }

  @ApiKeyCheck()
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_SECURITY)
  @ApiSecurity('b2crypto-key')
  @NoCache()
  @Get('email/:userEmail')
  // @CheckPoliciesAbility(new PolicyHandlerUserRead())
  async findOneByEmail(@Param('userEmail') email: string) {
    const rta = await this.findUserByEmail(email);
    if (!rta.list[0]) {
      throw new NotFoundException('Email not found');
    }
    return {
      statusCode: 200,
      message: 'Email founded',
    };
  }

  @NoCache()
  @Get(':userID')
  // @CheckPoliciesAbility(new PolicyHandlerUserRead())
  async findOneById(@Param('userID') id: string) {
    return this.userService.getOne(id);
  }

  @Get('check-balance/:userID')
  // @CheckPoliciesAbility(new PolicyHandlerUserRead())
  async checkBalance(@Param('userID') id?: string) {
    return this.userService.updateBalance(id);
  }

  @Get('check-slug-email/:userID')
  // @CheckPoliciesAbility(new PolicyHandlerUserRead())
  async checkSlugEmail(@Param('userID') id?: string) {
    return this.userService.updateSlugEmail(id);
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

  @Patch('level-up')
  // @CheckPoliciesAbility(new PolicyHandlerUserUpdate())
  async levelUp(@Body() userLevelUpDto: UserLevelUpDto) {
    try {
      return this.userService.levelUp(userLevelUpDto);
    } catch (error) {
      throw new BadRequestException(error);
    }
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
  @EventPattern(EventsNamesUserEnum.checkBalanceUser)
  async checkBalanceEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    id = id ?? '0';
    await this.userService.updateBalance(id);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesUserEnum.findOneByEmail)
  async findOneByEmailEvent(@Payload() email: string, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    const users = await this.userService.getAll({
      where: {
        slugEmail: CommonService.getSlug(email),
      },
    });
    return users.list[0];
  }

  @AllowAnon()
  @EventPattern(EventsNamesUserEnum.verifyEmail)
  async verifyEmail(@Payload() email: string, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    const rta = await this.findUserByEmail(email);
    if (!rta.list[0]) {
      throw new NotFoundException(`Email "${email}" not found`);
    }
    const user = rta.list[0];
    if (!isBoolean(user.verifyEmail) || user.verifyEmail) {
      await this.userService.customUpdateOne({
        id: user._id,
        verifyEmail: false,
      });
    }
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
      throw new NotFoundException(`Not found user ApiKey "${publicKey}"`);
    }
    return users.list[0];
  }

  private async findUserByEmail(email: string) {
    const query = {
      where: {
        slugEmail: CommonService.getSlug(email),
      },
    };
    return await this.userService.getAll(query);
  }
}
