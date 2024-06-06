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
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import ResponseB2Crypto from '@response-b2crypto/response-b2crypto/models/ResponseB2Crypto';
import { UserRegisterDto } from '@user/user/dto/user.register.dto';
import EventsNamesActivityEnum from 'apps/activity-service/src/enum/events.names.activity.enum';
import { Cache } from 'cache-manager';
import EventsNamesUserEnum from './enum/events.names.user.enum';
import { BadRequestError } from 'passport-headerapikey';

@ApiTags('AUTHENTICATION')
@Controller('auth')
export class AuthServiceController {
  private eventClient: ClientProxy;
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @Inject(BuildersService)
    private builder: BuildersService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.eventClient = this.builder.getEventClient();
  }

  @AllowAnon()
  @Post('identify/link')
  async sumsubToken() {
    throw new ForbiddenException();
  }

  @AllowAnon()
  @Get('otp/:email')
  async getOtp(@Param('email') email: string) {
    let otpSended = await this.cacheManager.get(email);
    if (!otpSended) {
      const user = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.findAll,
        {
          where: {
            email: email,
          },
        },
      );
      if (!user.list[0]) {
        throw new NotFoundException(`Email ${email} not found`);
      }
      otpSended = CommonService.randomIntNumber(999999);
      await this.cacheManager.set(email, otpSended, 30000);
    }
    // Enviar OTP al user
    Logger.debug(otpSended, `OTP ${email}`);
    return {
      statusCode: 201,
      message: 'OTP Sended',
    };
  }

  @AllowAnon()
  @Get('otp/:email/:otp')
  async validateOtp(@Param('email') email: string, @Param('otp') otp: string) {
    const otpSended = await this.cacheManager.get(email);
    if (!otpSended) {
      const user = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.findAll,
        {
          where: {
            email: email,
          },
        },
      );
      if (!user.list[0]) {
        throw new NotFoundException(`Email ${email} not found`);
      }
      throw new NotFoundException('Time out OTP');
    }
    if (otpSended.toString() !== otp) {
      throw new BadRequestError('Not valid OTP');
    }
    await this.cacheManager.del(email);
    return {
      statusCode: 200,
      message: 'OTP is valid',
    };
  }

  @AllowAnon()
  @Post('registry')
  async registryUser(@Body() userDto: UserRegisterDto) {
    return this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.createOne,
      userDto,
    );
  }

  @IsRefresh()
  @ApiKeyCheck()
  @Post('refresh-token')
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

  @AllowAnon()
  @ApiKeyCheck()
  @Post('sign-in')
  @UseGuards(LocalAuthGuard)
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
}

interface UserCodeDto {
  user: any;
  code: string;
}
