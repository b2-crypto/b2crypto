import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
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

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import ActionsEnum from '@common/common/enums/ActionEnum';
import TransportEnum from '@common/common/enums/TransportEnum';
import GenericServiceController from '@common/common/interfaces/controller.generic.interface';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
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
import { UserLevelUpDto } from '@user/user/dto/user.level.up.dto';
import { UserRegisterDto } from '@user/user/dto/user.register.dto';
import { UserUpdateDto } from '@user/user/dto/user.update.dto';
import { UserEntity } from '@user/user/entities/user.entity';
import EventsNamesMessageEnum from 'apps/message-service/src/enum/events.names.message.enum';
import { isBoolean } from 'class-validator';
import { SwaggerSteakeyConfigEnum } from 'libs/config/enum/swagger.stakey.config.enum';
import { ObjectId } from 'mongodb';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import EventsNamesUserEnum from './enum/events.names.user.enum';
import { UserServiceService } from './user-service.service';

@ApiTags('USER')
@Traceable()
@Controller('users')
export class UserServiceController implements GenericServiceController {
  constructor(
    @InjectPinoLogger(UserServiceController.name)
    protected readonly logger: PinoLogger,
    private readonly userService: UserServiceService,
    @Inject(BuildersService)
    readonly builder: BuildersService,
  ) {}

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

  @Post('massive-email')
  @NoCache()
  async generatePasswordEmail() {
    let page = 1;
    let totalPages = 0;
    do {
      const users = await this.findAll({ page });
      if (users?.list?.length > 0) {
        this.logger.debug(
          `Users: ${users?.list?.length} & Page: ${page}`,
          `MassiveEmail.${UserServiceController.name}`,
        );
        page++;
        totalPages = users?.lastPage ?? 0;
        for (let i = 0; i < users?.list?.length; i++) {
          const user = users.list[i];
          if (user && user?.email) {
            const pwd: string = CommonService.generatePassword(8);
            const changePassword: UserChangePasswordDto = {
              password: pwd,
              confirmPassword: pwd,
            };
            await this.changePassword(user?.id, changePassword);
            this.logger.debug(
              `${user?.email}`,
              `MassiveEmail.${UserServiceController.name}`,
            );
            const emailData = {
              destinyText: user.email,
              transport: TransportEnum.EMAIL,
              vars: {
                name: user.name,
                username: user.username,
                password: pwd,
              },
            };
            this.builder.emitMessageEventClient(
              EventsNamesMessageEnum.sendPasswordRestoredEmail,
              emailData,
            );
          }
        }
      }
    } while (page <= totalPages);
  }

  @Patch()
  // @CheckPoliciesAbility(new PolicyHandlerUserUpdate())
  async updateOne(@Body() updateUserDto: UserUpdateDto, @Req() req?: any) {
    updateUserDto.id = updateUserDto.id || CommonService.getUserId(req);
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
  @MessagePattern(EventsNamesUserEnum.migrateOne)
  async migrateOne(@Payload() createDto: any, @Ctx() ctx: RmqContext) {
    try {
      let user: any;
      const users = await this.findAll({
        where: {
          slugEmail: CommonService.getSlug(createDto.email),
        },
      });
      if (users?.list?.length > 0) {
        user = users.list[0];
        /*user.verifyIdentity = createDto.verifyIdentity;
        user.verifyIdentityLevelName = createDto.verifyIdentityLevelName;
        user = await this.updateOne(user);*/
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
  async activeTwoFactor(@Payload() user: UserEntity, @Ctx() ctx: RmqContext) {
    await this.userService.updateUser({
      id: user.id,
      twoFactorIsActive: true,
    });
    CommonService.ack(ctx);
  }

  @AllowAnon()
  @EventPattern(EventsNamesUserEnum.updateLeveluser)
  async updateLevelUser(
    @Payload() data: { user: string; level: string },
    @Ctx() ctx: RmqContext,
  ) {
    await this.userService.updateLevelUser(data.level, data.user);
    CommonService.ack(ctx);
  }

  private async findOneByApiKey(publicKey: string) {
    const users = await this.userService.getAll({
      where: {
        apiKey: publicKey,
      },
    });
    if (!users.totalElements) {
      throw new NotFoundException('Not found user');
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
  @Patch('level-up')
  async levelUp(@Body() userLevelUpDto: UserLevelUpDto, @Req() req?: any) {
    try {
      userLevelUpDto.user = req?.user.id;
      return this.userService.levelUp(userLevelUpDto);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
  @Patch('verify-by-card')
  async verifyUsersWithCard() {
    const query = new QuerySearchAnyDto();
    query.where = query.where ?? {};
    query.where.verifyIdentity = false;
    query.page = 0;
    query.take = 10;
    let users: ResponsePaginator<UserEntity> = null;
    const promises = [];
    do {
      ++query.page;
      users = await this.userService.getAll({
        ...query,
      });
      for (const user of users.list) {
        promises.push(
          this.userService.verifyUsersWithCard(user._id.toString()),
        );
      }
    } while (query.page < users.lastPage);
    return Promise.all(promises);
  }
  @Patch('rules/me')
  async getRulesMe(@Req() req?: any) {
    return this.getRules(req);
  }

  @Patch('rules')
  async getRules(@Req() req?: any) {
    const user = req?.user;
    const query = new QuerySearchAnyDto();
    query.where = query.where ?? {};
    query.page = 0;
    query.take = 10;
    query.relations = ['level'];
    if (user.id) {
      query.where._id = user.id;
    }
    let users: ResponsePaginator<UserEntity> = null;
    const promises = [];
    do {
      ++query.page;
      users = await this.userService.getAll({
        ...query,
      });
      for (const user of users.list) {
        promises.push(
          this.userService
            .applyAndGetRules({
              id: user._id,
              level: user.level,
            } as unknown as UserUpdateDto)
            .then((usr) => {
              this.logger.debug(
                `Apply level ${user.level?.name} to user ${user.email}`,
                `page ${query.page}/${users.lastPage}`,
              );
              return {
                user: usr._id,
                level: usr.level._id,
                email: usr.email,
                rules: usr.rules,
              };
            }),
        );
      }
    } while (query.page < users.lastPage);
    return Promise.all(promises);
  }
  @AllowAnon()
  @EventPattern(EventsNamesUserEnum.checkBalanceUser)
  async checkBalanceEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    id = id ?? '0';
    await this.userService.updateBalance(id);
  }
}
