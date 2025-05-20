import { Traceable } from '@amplication/opentelemetry-nestjs';
import { AuthService } from '@auth/auth';
import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { IsRefresh } from '@auth/auth/decorators/refresh.decorator';
import { RestorePasswordDto } from '@auth/auth/dto/restore.password.dto';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { LocalAuthGuard } from '@auth/auth/guards/local.auth.guard';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import ActionsEnum from '@common/common/enums/ActionEnum';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import TransportEnum from '@common/common/enums/TransportEnum';
import { IntegrationService } from '@integration/integration';
import { IntegrationIdentityEnum } from '@integration/integration/identity/generic/domain/integration.identity.enum';
import { SumsubApplicantLevels } from '@integration/integration/identity/generic/domain/sumsub.enum';
import { SumsubIssueTokenDto } from '@integration/integration/identity/generic/domain/sumsub.issue.token.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientProxy,
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { PersonCreateDto } from '@person/person/dto/person.create.dto';
import ResponseB2Crypto from '@response-b2crypto/response-b2crypto/models/ResponseB2Crypto';
import { UserPreRegisterDto } from '@user/user/dto/user.pre.register.dto';
import { UserRefreshTokenDto } from '@user/user/dto/user.refresh.token.dto';
import { UserRegisterDto } from '@user/user/dto/user.register.dto';
import { UserSignInDto } from '@user/user/dto/user.signin.dto';
import { UserDocument } from '@user/user/entities/mongoose/user.schema';
import { UserEntity } from '@user/user/entities/user.entity';
import EventsNamesActivityEnum from 'apps/activity-service/src/enum/events.names.activity.enum';
import EventsNamesMessageEnum from 'apps/message-service/src/enum/events.names.message.enum';
import EventsNamesPersonEnum from 'apps/person-service/src/enum/events.names.person.enum';
import { isBoolean } from 'class-validator';
import { SwaggerSteakeyConfigEnum } from 'libs/config/enum/swagger.stakey.config.enum';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { BadRequestError } from 'passport-headerapikey';
import EventsNamesUserEnum from '../../user-service/src/enum/events.names.user.enum';

@ApiTags('AUTHENTICATION')
@Traceable()
@Controller('auth')
export class AuthServiceController {
  private eventClient: ClientProxy;
  constructor(
    @InjectPinoLogger(AuthServiceController.name)
    protected readonly logger: PinoLogger,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @Inject(BuildersService)
    private builder: BuildersService,
    @Inject(IntegrationService)
    private integration: IntegrationService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.eventClient = this.builder.getEventClient();
  }

  @UseGuards(ApiKeyAuthGuard)
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_SECURITY)
  @ApiBearerAuth('bearerToken')
  @ApiSecurity('b2crypto-key')
  @Post('identity/url')
  async sumsubGenerateUrl(
    @Body() identityDto: SumsubIssueTokenDto,
    @Req() req,
  ) {
    const client = await this.getClientFromPublicKey(req.clientApi, false);
    const user = req.user;
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const userEntity = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.findOneById,
      user.id,
    );
    if (this.isExpiredUrl(new Date(userEntity.verifyIdentityExpiredAt))) {
      user.verifyIdentityCode = await this.getIdentityCode(identityDto, user);
    }
    return {
      statusCode: 200,
      data: {
        //url: `${req.protocol}://${req.headers.host}/auth/identity/page/${user.id}?apiKey=${client.apiKey}`,
        url: `https://${req.headers.host}/auth/identity/page/${user.id}?apiKey=${client.apiKey}`,
      },
    };
  }

  @Post('identity/token')
  @UseGuards(ApiKeyAuthGuard)
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_SECURITY)
  @ApiBearerAuth('bearerToken')
  @ApiSecurity('b2crypto-key')
  async sumsubGeneratetoken(
    @Body() identityDto: SumsubIssueTokenDto,
    @Req() req,
  ) {
    const user = req.user;
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const data = await this.getIdentityToken(identityDto, user);
    return {
      statusCode: 200,
      data,
    };
  }

  @AllowAnon()
  @NoCache()
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_SECURITY)
  @ApiParam({
    name: 'userId',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'apiKey',
    type: String,
    required: true,
  })
  @Get('identity/page/:userId')
  async sumsubGetPage(
    @Param('userId') userId,
    @Query('apiKey') clientId,
    @Res() res,
  ) {
    const client = await this.getClientFromPublicKey(clientId);
    if (!client.isClientAPI) {
      throw new UnauthorizedException();
    }
    const user = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.findOneById,
      userId,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (
      !user.verifyIdentityCode ||
      this.isExpiredUrl(new Date(user.verifyIdentityExpiredAt))
    ) {
      user.verifyIdentityCode = await this.getIdentityCode(
        {
          ttlInSecs: user.verifyIdentityTtl ?? 900,
          levelName:
            user.verifyIdentityLevelName ??
            SumsubApplicantLevels.individual_basicKYCLevel,
          userId: userId,
        },
        user,
      );
    }
    return res.redirect(
      HttpStatus.TEMPORARY_REDIRECT,
      this.getSumsubVerifyIdentityUrl(user.verifyIdentityCode),
    );
  }

  private isExpiredUrl(expiredAt: Date) {
    const tenMinutesFromNow = new Date(new Date().getTime() + 10 * 60 * 1000);
    return expiredAt.getTime() < tenMinutesFromNow.getTime();
  }

  private async getClientFromPublicKey(
    clientId,
    apiKey = true,
  ): Promise<UserEntity> {
    try {
      let client;
      if (apiKey) {
        client = await this.builder.getPromiseUserEventClient(
          EventsNamesUserEnum.findOneByApiKey,
          clientId,
        );
      } else {
        client = await this.builder.getPromiseUserEventClient(
          EventsNamesUserEnum.findOneById,
          clientId,
        );
      }
      if (!client) {
        throw new UnauthorizedException();
      }
      return client;
    } catch (err) {
      this.logger.error(
        `[getClientFromPublicKey] Error getting client from public key: ${
          err.message || err
        }`,
      );
      throw new UnauthorizedException();
    }
  }

  private async getIdentityCode(identityDto: SumsubIssueTokenDto, user) {
    const identity = await this.integration.getIdentityIntegration(
      IntegrationIdentityEnum.SUMSUB,
    );
    try {
      identityDto.userId = user.id ?? user._id;
      identityDto.ttlInSecs = identityDto.ttlInSecs ?? 900;
      const rta = await identity.generateUrlApplicant(identityDto);
      if (!rta.url) {
        throw rta;
      }
      const code = rta.url.split('#').pop();
      user.verifyIdentityCode = code;
      const expiredAt = new Date().getTime() + identityDto.ttlInSecs * 1000;
      this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, {
        id: user.id ?? user._id,
        verifyIdentityCode: code,
        verifyIdentityTtl: identityDto.ttlInSecs,
        verifyIdentityLevelName: identityDto.levelName,
        verifyIdentityExpiredAt: expiredAt,
      });
      return code;
    } catch (err) {
      this.logger.error(
        `[getIdentityCode] Bad request Identity code: ${err.message || err}`,
      );
      throw new BadGatewayException();
    }
  }

  private async getIdentityToken(identityDto: SumsubIssueTokenDto, user) {
    const identity = await this.integration.getIdentityIntegration(
      IntegrationIdentityEnum.SUMSUB,
    );
    try {
      identityDto.userId = user.id ?? user._id;
      identityDto.ttlInSecs = identityDto.ttlInSecs ?? 900;
      const rta = await identity.generateTokenApplicant(identityDto);
      if (!rta.token) {
        throw rta;
      }
      return rta;
    } catch (err) {
      this.logger.error(
        `[getIdentityToken] Bad request Identity token: ${err.message || err}`,
      );
      throw new BadGatewayException();
    }
  }

  private getSumsubVerifyIdentityUrl(code: string) {
    return `https://in.sumsub.com/idensic/l/#${code}`;
  }

  @ApiKeyCheck()
  @NoCache()
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_SECURITY)
  @ApiSecurity('b2crypto-key')
  @Post('restore-password')
  async restorePassword(@Body() restorePasswordDto: RestorePasswordDto) {
    try {
      const user = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.findOneByEmail,
        restorePasswordDto.email,
      );

      // Validate user
      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (
        restorePasswordDto.otp &&
        restorePasswordDto.password &&
        restorePasswordDto.password2
      ) {
        // Validate password
        if (restorePasswordDto.password !== restorePasswordDto.password2) {
          throw new BadRequestException('Bad password');
        }
        const otpSended = await this.getOtpGenerated(user.email);
        // Validate OTP
        if (!otpSended) {
          throw new BadRequestException('Expired OTP');
        } else if (restorePasswordDto.otp != otpSended) {
          throw new BadRequestException('Bad OTP');
        }
        await this.deleteOtpGenerated(restorePasswordDto.email);
        const psw = restorePasswordDto.password;
        const datetime = new Intl.DateTimeFormat('es-CO', {
          dateStyle: 'full',
          timeStyle: 'long',
          timeZone: 'America/Bogota',
        }).format(new Date());
        const datetimeCapitalized =
          datetime.charAt(0).toUpperCase() + datetime.slice(1);
        const emailData = {
          name: `Actualizacion de clave`,
          body: `Tu clave ha sido actualizada exitosamente ${user.name}`,
          originText: 'Sistema',
          destinyText: user.email,
          transport: TransportEnum.EMAIL,
          destiny: null,
          vars: {
            name: user.name,
            username: user.email,
            password: psw,
            datetime: datetimeCapitalized,
          },
        };
        this.builder.emitMessageEventClient(
          EventsNamesMessageEnum.sendPasswordRestoredEmail,
          emailData,
        );
        await this.builder.getPromiseUserEventClient(
          EventsNamesUserEnum.updateOne,
          {
            id: user._id,
            verifyEmail: false,
            password: CommonService.getHash(psw),
          },
        );

        return {
          statusCode: 200,
          message: 'Password updated',
        };
      }

      await this.generateOtp({ email: restorePasswordDto.email } as any);
      return {
        statusCode: 201,
        message: 'OTP generated',
      };
    } catch (error) {
      this.logger.error(
        `[restorePassword] Error restoring password: ${error.message || error}`,
      );
      throw error;
    }
  }

  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('b2crypto-key')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_SECURITY)
  @NoCache()
  @Get('otp/:email')
  async getOtp(@Param('email') email: string) {
    await this.generateOtp({ email } as any);
    // Enviar OTP al user
    return {
      statusCode: 201,
      message: 'OTP Sended',
      data: {
        duration: 60000,
      },
    };
  }

  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('b2crypto-key')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_SECURITY)
  @NoCache()
  @Get('otp/:email/:otp')
  async validateOtp(@Param('email') email: string, @Param('otp') otp: string) {
    const otpSended = await this.getOtpGenerated(email);
    if (!otpSended) {
      /* const user = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.findAll,
        {
          where: {
            email: email,
          },
        },
      );
      if (!user.list[0]) {
        throw new NotFoundException(`Email ${email} not found`);
      } */
      throw new NotFoundException('Expired OTP');
    }
    if (otpSended.toString() !== otp) {
      throw new BadRequestError('Not valid OTP');
    }
    await this.deleteOtpGenerated(email);
    this.builder.emitUserEventClient(EventsNamesUserEnum.verifyEmail, email);
    return {
      statusCode: 200,
      message: 'OTP is valid',
    };
  }

  @AllowAnon()
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('b2crypto-key')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_SECURITY)
  /* @ApiResponse({
    status: 201,
    description: 'was searched successfully',
    type: LeadResponseDto,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(401, ActionsEnum.LOGIN))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403, ActionsEnum.LOGIN))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404, ActionsEnum.LOGIN))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500, ActionsEnum.LOGIN)) */
  @Post('registry')
  async registryUser(@Body() userDto: UserRegisterDto, @Req() req) {
    const client = await this.getClientFromPublicKey(req.clientApi, false);
    userDto.name =
      userDto.name ?? userDto.username ?? userDto.email.split('@')[0];
    userDto.slugEmail = CommonService.getSlug(userDto.email);
    userDto.username = userDto.username ?? userDto.name;
    userDto.slugUsername = CommonService.getSlug(userDto.username);
    userDto.brand = client.brand;
    const createdUser = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.createOne,
      userDto,
    );
    const emailData = {
      destinyText: createdUser.email,
      vars: {
        name: createdUser.name,
        email: createdUser.email,
        username: createdUser.username,
        isIndividual: createdUser.individual,
        isActive: createdUser.active,
      },
    };

    try {
      this.builder.emitMessageEventClient(
        EventsNamesMessageEnum.sendProfileRegistrationCreation,
        emailData,
      );
    } catch (error) {
      this.logger.error(
        `[registryUser] Error sending user registration email: ${
          error.message || error
        }`,
      );
    }

    return createdUser;
  }

  @NoCache()
  @AllowAnon()
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('b2crypto-key')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_SECURITY)
  /* @ApiResponse({
    status: 201,
    description: 'was searched successfully',
    type: LeadResponseDto,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(401, ActionsEnum.LOGIN))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403, ActionsEnum.LOGIN))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404, ActionsEnum.LOGIN))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500, ActionsEnum.LOGIN)) */
  @Post('pre-registry')
  async preRegistryUser(@Body() userDto: UserPreRegisterDto, @Req() req) {
    userDto.name =
      userDto.name ?? userDto.username ?? userDto.email.split('@')[0];
    userDto.slugEmail = CommonService.getSlug(userDto.email);
    userDto.username = userDto.username ?? userDto.name;
    userDto.slugUsername = CommonService.getSlug(userDto.username);
    const client = await this.getClientFromPublicKey(req.clientApi, false);
    userDto.description = userDto.campaign ?? client.name;
    userDto.brand = client.brand;
    const user = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.createOne,
      userDto,
    );
    if (!user._id) {
      throw new BadRequestException('User already exists');
    }
    try {
      user.personalData = await this.builder.getPromisePersonEventClient(
        EventsNamesPersonEnum.createOne,
        {
          taxIdentificationValue: '',
          preRegistry: true,
          name: userDto.name,
          firstName: userDto.name,
          slugName: CommonService.getSlug(userDto.name),
          email: userDto.email,
          emails: [userDto.email],
          phoneNumber: userDto.phone,
          user: user._id.toString(),
        } as unknown as PersonCreateDto,
      );

      await this.builder.emitMessageEventClient(
        EventsNamesMessageEnum.sendPreRegisterEmail,
        {
          destinyText: user.email,
          vars: {
            name: user.name,
            email: user.email,
            clientName: client.name,
          },
        },
      );

      // TODO[hender-20/09/2024] Check why the active data is not saved in creation
      this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, {
        id: user._id.toString(),
        active: !!userDto.active,
      });

      return user;
    } catch (error) {
      await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.deleteOneById,
        user._id.toString(),
      );
      //throw error;
      throw new BadRequestException('Person already exists');
    }
  }

  @IsRefresh()
  @NoCache()
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('b2crypto-key')
  @Post('refresh-token')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_SECURITY)
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(200))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  async refreshToken(@Body() data: UserRefreshTokenDto) {
    if (!data || !data?.refresh) {
      throw new BadRequestException('Not found refresh token');
    }
    const rta = await this.authService.refreshTokenUser(data.refresh);
    return {
      access_token: rta.access_token,
      refresh_token: rta.refresh_token,
    };
  }

  @ApiKeyCheck()
  @NoCache()
  @Post('sign-in')
  @UseGuards(ApiKeyAuthGuard, LocalAuthGuard)
  @ApiSecurity('b2crypto-key')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_SECURITY)
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(200))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  async signIn(@Req() req, @Body() data: UserSignInDto) {
    const user = req.user;
    if (req.body.code && !user.twoFactorIsActive) {
      // Validated Two Factor Authentication
      this.authService.activeTwoFactor(user.id);
      user.twoFactorIsActive = true;
      delete user.twoFactorQr;
      delete user.twoFactorSecret;
    }

    return this.authorizationEvent({
      user: user,
      code: req.body.code,
    });
  }

  @NoCache()
  @AllowAnon()
  @MessagePattern(EventsNamesUserEnum.authorization)
  async authorizationEvent(
    @Payload() userCodeDto: UserCodeDto,
    @Ctx() ctx?: RmqContext,
  ) {
    CommonService.ack(ctx);
    const g2fa = this.configService.get<string>('GOOGLE_2FA');
    if (g2fa === 'true') {
      if (!!userCodeDto.user.twoFactorIsActive || !!userCodeDto.code) {
        // Get token
        let rta = {
          statusCode: 201,
          access_token: await this.authService.getTokenData(userCodeDto.user),
          refresh_token: await this.authService.getTokenData(
            userCodeDto.user,
            true,
          ),
        };
        if (userCodeDto.user.apiData) {
          // If query is from the software with ApiKey, return he user
          rta = userCodeDto.user;
        }
        this.registerActivity({
          resource: ResourcesEnum.USER,
          action: ActionsEnum.LOGIN,
          creator: userCodeDto.user.id,
          object: userCodeDto.user,
        });
        return rta;
      }

      if (!userCodeDto.user.twoFactorQr) {
        userCodeDto.user = await this.authService.updateTwoFactor(
          userCodeDto.user.id,
        );
        this.registerActivity({
          resource: ResourcesEnum.USER,
          action: ActionsEnum.UPDATE,
          creator: userCodeDto.user.id,
          object: userCodeDto.user,
        });
      }
      return {
        statusCode: 202,
        data: userCodeDto.user.twoFactorQr,
      };
    }
    userCodeDto.user.twoFactorIsActive = true;
    delete userCodeDto.user.twoFactorQr;
    delete userCodeDto.user.twoFactorSecret;
    delete userCodeDto.user.twoFactorIsActive;
    // Checks verified email (first time sing-in)
    const statusCode =
      !isBoolean(userCodeDto.user.verifyEmail) ||
      userCodeDto.user.verifyEmail === true
        ? HttpStatus.MOVED_PERMANENTLY
        : HttpStatus.CREATED;
    // Get token
    let rta = {
      statusCode,
      access_token: await this.authService.getTokenData(userCodeDto.user),
      refresh_token: await this.authService.getTokenData(
        userCodeDto.user,
        true,
      ),
    };
    if (userCodeDto.user.apiData) {
      // If query is from the software with ApiKey, return he user
      rta = userCodeDto.user;
    }
    this.registerActivity({
      resource: ResourcesEnum.USER,
      action: ActionsEnum.LOGIN,
      creator: userCodeDto.user.id,
      object: userCodeDto.user,
    });
    return rta;
  }

  /* @IsRefresh()
  @Patch('refresh')
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(200))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  async refreshToken(@Request() req) {
    const { authorization } = req.headers;
    return this.refreshTokenEvent(authorization);
  } */

  @AllowAnon()
  @MessagePattern(EventsNamesUserEnum.refreshToken)
  async refreshTokenEvent(@Payload() token, @Ctx() ctx?: RmqContext) {
    CommonService.ack(ctx);
    const { access_token, user } = await this.authService.refreshTokenUser(
      token,
    );
    this.registerActivity({
      resource: ResourcesEnum.USER,
      action: ActionsEnum.LOGIN,
      creator: user.id,
      object: user,
    });
    return { access_token };
  }

  private registerActivity(data: any) {
    this.builder.emitActivityEventClient(
      EventsNamesActivityEnum.registerActivity,
      data,
    );
  }

  private async generateOtp(user: UserDocument, msOTP?: number) {
    const otpTTL =
      msOTP ??
      this.configService.get<number>('OTP_VALIDATION_TIME_SECONDS', 120) * 1000;
    const email = user.email?.toLowerCase() ?? user.email;

    const otpSended =
      (await this.getOtpGenerated(email)) ?? CommonService.getOTP();

    await this.cacheManager.set(email, otpSended, otpTTL);

    const data = {
      destinyText: email,
      destiny: user?._id
        ? {
            resourceId: user?._id,
            resourceName: ResourcesEnum.USER,
          }
        : null,
      vars: {
        name: user.name ?? email,
        lastname: '',
        otp: otpSended,
      },
    };

    this.logger.info(`[generateOtp] OTP Sended: ${JSON.stringify(data)}`);
    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendEmailOtpNotification,
      data,
    );
    return otpSended;
  }

  private async getOtpGenerated(email: string) {
    const _email = email?.toLowerCase() ?? email;
    this.logger.info(`[getOtpGenerated] email: ${_email}`);
    return this.cacheManager.get<number>(_email);
  }

  private async deleteOtpGenerated(email: string) {
    const _email = email?.toLowerCase() ?? email;
    this.logger.info(`[deleteOtpGenerated] email: ${_email}`);
    return this.cacheManager.del(_email);
  }
}

interface UserCodeDto {
  user: any;
  code: string;
}
