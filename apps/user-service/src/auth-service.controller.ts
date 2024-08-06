import { IntegrationIdentityEnum } from './../../../libs/integration/src/identity/generic/domain/integration.identity.enum';
import { AuthService } from '@auth/auth';
import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { IsRefresh } from '@auth/auth/decorators/refresh.decorator';
import { LocalAuthGuard } from '@auth/auth/guards/local.auth.guard';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import ActionsEnum from '@common/common/enums/ActionEnum';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import {
  BadGatewayException,
  BadRequestException,
  Body,
  CACHE_MANAGER,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Request,
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
  ApiHeader,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import ResponseB2Crypto from '@response-b2crypto/response-b2crypto/models/ResponseB2Crypto';
import { UserRegisterDto } from '@user/user/dto/user.register.dto';
import EventsNamesActivityEnum from 'apps/activity-service/src/enum/events.names.activity.enum';
import { Cache } from 'cache-manager';
import EventsNamesUserEnum from './enum/events.names.user.enum';
import { BadRequestError } from 'passport-headerapikey';
import { RestorePasswordDto } from '@auth/auth/dto/restore.password.dto';
import EventsNamesMessageEnum from 'apps/message-service/src/enum/events.names.message.enum';
import { MessageCreateDto } from '@message/message/dto/message.create.dto';
import TransportEnum from '@common/common/enums/TransportEnum';
import { UserDocument } from '@user/user/entities/mongoose/user.schema';
import { IntegrationService } from '@integration/integration';
import { SumsubIssueTokenDto } from '@integration/integration/identity/generic/domain/sumsub.issue.token.dto';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';

@ApiTags('AUTHENTICATION')
@Controller('auth')
export class AuthServiceController {
  private eventClient: ClientProxy;
  constructor(
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

  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @ApiTags('Stakey Security')
  @ApiBearerAuth('bearerToken')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
  @Post('identity/token')
  async sumsubToken(@Body() identityDto: SumsubIssueTokenDto, @Req() req) {
    const client = req.clientApi;
    const identity = await this.integration.getIdentityIntegration(
      IntegrationIdentityEnum.SUMSUB,
    );
    try {
      const rta = await identity.generateToken(identityDto);
      return {
        token: '',
        userId: identityDto.userId,
      };
    } catch (err) {
      throw new BadGatewayException();
    }
  }

  @ApiKeyCheck()
  @ApiTags('Stakey Security')
  @ApiBearerAuth('bearerToken')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
  @Post('restore-password')
  async restorePassword(@Body() restorePasswordDto: RestorePasswordDto) {
    const users = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.findAll,
      {
        where: {
          email: `/${restorePasswordDto.email}/gi`,
        },
      },
    );
    // Validate user
    if (!users.list[0]) {
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
      const otpSended = await this.getOtpGenerated(restorePasswordDto.email);
      // Validate OTP
      if (!otpSended) {
        throw new BadRequestException('Expired OTP');
      } else if (restorePasswordDto.otp !== otpSended) {
        throw new BadRequestException('Bad OTP');
      }
      await this.deleteOtpGenerated(restorePasswordDto.email);
      await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.updateOne,
        {
          id: users.list[0]._id,
          password: CommonService.getHash(restorePasswordDto.password),
        },
      );
      return {
        statusCode: 200,
        message: 'Password updated',
      };
    }
    // send otp
    await this.generateOtp({ email: restorePasswordDto.email } as any);
    return {
      statusCode: 201,
      message: 'OTP generated',
    };
  }

  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @ApiTags('Stakey Security')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
  @Get('otp/:email')
  async getOtp(@Param('email') email: string) {
    await this.generateOtp({ email } as any);
    // Enviar OTP al user
    return {
      statusCode: 201,
      message: 'OTP Sended',
    };
  }

  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @ApiTags('Stakey Security')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
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
    return {
      statusCode: 200,
      message: 'OTP is valid',
    };
  }

  @AllowAnon()
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @ApiTags('Stakey Security')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
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
  async registryUser(@Body() userDto: UserRegisterDto) {
    userDto.name =
      userDto.name ?? userDto.username ?? userDto.email.split('@')[0];
    userDto.slugEmail = CommonService.getSlug(userDto.email);
    userDto.username = userDto.username ?? userDto.name;
    userDto.slugUsername = CommonService.getSlug(userDto.username);
    return this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.createOne,
      userDto,
    );
  }

  @IsRefresh()
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @Post('refresh-token')
  @ApiTags('Stakey Security')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(200))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  async refreshToken(@Body() data: { refresh: string }) {
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
  @Post('sign-in')
  @UseGuards(ApiKeyAuthGuard, LocalAuthGuard)
  @ApiTags('Stakey Security')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(200))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  async signIn(@Request() req) {
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

  private async generateOtp(user: UserDocument, msOTP = 60000) {
    let otpSended = await this.getOtpGenerated(user.email);
    if (!otpSended) {
      otpSended = CommonService.randomIntNumber(999999);
      await this.cacheManager.set(user.email, otpSended, msOTP);
    }
    const data = {
      name: `OTP to ${user.email}`,
      body: `The OTP is ${otpSended}`,
      originText: `System`,
      destinyText: user.email,
      transport: TransportEnum.EMAIL,
      destiny: null,
      vars: {
        name: user.name ?? user.email,
        lastname: '',
        otp: otpSended,
      },
    };
    if (user._id) {
      data.destiny = {
        resourceId: user._id,
        resourceName: ResourcesEnum.USER,
      };
    }
    Logger.log(data, 'OTP Sended');
    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendEmailOtpNotification,
      data,
    );
    return otpSended;
  }

  private async getOtpGenerated(email: string) {
    return this.cacheManager.get(email);
  }

  private async deleteOtpGenerated(email: string) {
    return this.cacheManager.del(email);
  }
}

interface UserCodeDto {
  user: any;
  code: string;
}
