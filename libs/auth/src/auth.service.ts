import { AffiliateServiceMongooseService } from '@affiliate/affiliate';
import { AffiliateInterface } from '@affiliate/affiliate/domain/entities/affiliate.interface';
import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { CrmServiceMongooseService } from '@crm/crm';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PermissionServiceMongooseService } from '@permission/permission';
import { UserServiceMongooseService } from '@user/user';
import { UserInterface } from '@user/user/entities/user.interface';
import EventsNamesAffiliateEnum from 'apps/affiliate-service/src/enum/events.names.affiliate.enum';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as qrcode from 'qrcode';
import * as speakeasy from 'speakeasy';
import { UserDocument } from '../../user/src/entities/mongoose/user.schema';
import { UserLoginDto } from './dto/user.login.dto';

@Traceable()
@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name)
    protected readonly logger: PinoLogger,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CrmServiceMongooseService)
    private readonly crmService: CrmServiceMongooseService,
    @Inject(UserServiceMongooseService)
    private readonly userService: UserServiceMongooseService,
    @Inject(PermissionServiceMongooseService)
    private readonly permissionService: PermissionServiceMongooseService,
    @Inject(AffiliateServiceMongooseService)
    private readonly affiliateService: AffiliateServiceMongooseService,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
  ) {}

  async authenticateUser(user) {
    return {
      user: user,
      access_token: this.jwtService.sign(await this.getPayload(user)),
      refresh_token: this.jwtService.sign(await this.getPayload(user, true)),
    };
  }

  async authenticate(dto: UserLoginDto) {
    return {
      access_token: await this.getTokenUser(dto.email, dto.password),
      refresh_token: await this.getTokenUser(dto.email, dto.password, true),
    };
  }

  async verifyTwoFactor(secret: string, code: string) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
    });
  }

  async decodeToken(token: string) {
    return this.jwtService.decode(token);
  }

  async getUser(email, password) {
    const listUser = await this.userService.findAll({
      relations: ['personalData'],
      where: {
        slugEmail: CommonService.getSlug(email),
      },
    } as QuerySearchAnyDto);
    const user = listUser.list[0];
    if (user && bcrypt.compareSync(password, user.password)) {
      /* let permissions = [];
      if (user.permissions) {
        permissions = (
          await this.permissionService.findAll({
            relations: ['scope'],
            where: {
              _id: user.permissions,
            },
          } as QuerySearchAnyDto)
        ).list;
      }
      user.permissions = permissions; */
      return user;
    }
    return new UnauthorizedException();
  }

  async activeTwoFactor(userId: string) {
    await this.userService.update(userId, {
      id: userId,
      twoFactorIsActive: true,
    });
  }

  async getTokenUser(email, password, isRefresh = false) {
    return this.jwtService.sign(
      this.getPayload(await this.getUser(email, password), isRefresh),
    );
  }

  async getTokenData(data, isRefresh = false) {
    if (isRefresh) {
      data = {
        ...data,
        token: randomUUID(),
      };
    }
    return this.jwtService.sign(data);
  }

  async refreshTokenUser(authorizationToken: string) {
    const tokenDecode = this.jwtService.decode(
      authorizationToken.replace('Bearer ', ''),
    ) as any;
    const dif_sec = Math.floor(Date.now() / 1000 - tokenDecode.exp);
    // TODO[hender] Export the max time to refresh token Default 60sec
    let maxSecondsToRefresh = this.configService.get(
      'AUTH_MAX_SECONDS_TO_REFRESH',
    );
    if (!maxSecondsToRefresh) {
      maxSecondsToRefresh = 60;
    } else {
      maxSecondsToRefresh = parseInt(maxSecondsToRefresh);
    }
    if (dif_sec > maxSecondsToRefresh) {
      throw new UnauthorizedException();
    }
    const user = await this.userService.findOne(tokenDecode?.id);
    if (!user || !user._id) {
      throw new BadRequestException('Not found user');
    }
    return this.authenticateUser(user as unknown as UserInterface);
  }

  async getPayload(user, refresh = false) {
    if (refresh) {
      return {
        id: user._id,
        api: user.apiData,
        email: user.email,
      };
    }
    const affiliate = user.affiliate;
    const crm = affiliate?.crm;
    const payload = {
      id: user._id,
      //api: user.apiData,
      brand: user.brand,
      email: user.email,
      verifyIdentity: user.verifyIdentity,
      verifyIdentityLevelName: user.verifyIdentityLevelName,
      lastName: user.personalData?.lastName,
      firstName: user.name || user.personalData?.name,
      crmId: crm,
      //tpId: affiliate?.crmIdAffiliate,
      brandId: affiliate?.brand,
      country:
        user.personalData?.location?.country ??
        affiliate?.country ??
        user.country,
      twoFactorQr: user.twoFactorQr,
      userParent: user.userParent,
      twoFactorIsActive: user.twoFactorIsActive,
      twoFactorSecret: user.twoFactorSecret,
      permissions: user.permissions,
      verifyEmail: user?.verifyEmail,
      //authorizations: user.authorizations,
    };
    if (
      this.configService.get('GOOGLE_2FA') === 'false' ||
      user.twoFactorIsActive
    ) {
      delete payload.twoFactorQr;
      delete payload.twoFactorSecret;
      delete user.twoFactorIsActive;
    }
    return payload;
  }

  async getCrm(crmId: string) {
    return await this.crmService.findOne(crmId);
  }

  async getAffiliates(affiliates: Array<string>, crm) {
    try {
      return await this.affiliateService.findAll({
        where: {
          _id: affiliates,
          crm: crm?._id,
        },
      });
    } catch (err) {
      this.logger.error(`[getAffiliates] ${err.message || err}`);
      throw new BadRequestException();
    }
  }

  async updateTwoFactor(userId: string) {
    if (userId) {
      const user = await this.userService.findOne(userId);
      if (user.id) {
        const appName =
          this.configService.get<string>('APP_NAME') ?? 'B2Crypto';
        const speakeasySecretParameters = speakeasy.generateSecret({
          name: appName + ' - ' + user.email,
        });
        const qrCodeUrlImg = await qrcode.toDataURL(
          speakeasySecretParameters?.otpauth_url,
        );
        user.twoFactorQr = qrCodeUrlImg;
        user.twoFactorSecret = speakeasySecretParameters?.base32;
        user.twoFactorIsActive = false;
        user.save();
        return user;
      }
    }
    throw new BadRequestException('User is not exist');
  }

  async getUserByApiKey(apiKey: string): Promise<UserDocument> {
    const rta: ResponsePaginator<UserDocument> = await this.userService.findAll(
      {
        where: {
          apiKey,
        },
      },
    );
    return rta.list[0];
  }

  async isValidApiKeyAffiliate(apiKey: string): Promise<boolean> {
    const affiliate: AffiliateInterface = await this.getAffiliateByPublicKey(
      apiKey,
    );
    return !!affiliate;
  }

  async getAffiliateByPublicKey(publicKey: string) {
    /* const list = await this.affiliateService.findAll({
      where: {
        publicKey: publicKey,
      },
    }); */
    const list = await this.builder.getPromiseAffiliateEventClient(
      EventsNamesAffiliateEnum.findOneByPublicKey,
      publicKey,
    );
    return list.totalElements == 1 && list.list[0];
  }
}
