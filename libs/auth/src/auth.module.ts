import { AffiliateModule } from '@affiliate/affiliate';
import { DistributedCacheModule } from '@app/distributed-cache';
import { BuildersModule } from '@builder/builders';
import { PomeloProcessConstants } from '@common/common/utils/pomelo.integration.process.constants';
import { PomeloHttpUtils } from '@common/common/utils/pomelo.integration.process.http.utils';
import { PomeloSignatureUtils } from '@common/common/utils/pomelo.integration.process.signature';
import { SumsubHttpUtils } from '@common/common/utils/sumsub.integration.process.http.utils';
import { SumsubSignatureUtils } from '@common/common/utils/sumsub.integration.process.signature';
import { CrmModule } from '@crm/crm';
import { IntegrationModule } from '@integration/integration';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PermissionModule } from '@permission/permission';
import { UserModule } from '@user/user';
import { AuthService } from './auth.service';
import { CaslAbilityFactory } from './casl-ability.factory';
import { PomeloSignatureGuard } from './guards/pomelo.signature.guard';
import { SumsubSignatureGuard } from './guards/sumsub.signature.guard';
import { ApiKeyAffiliateStrategy } from './strategies/api.key.affiliate.strategy';
import { ApiKeyStrategy } from './strategies/api.key.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    DistributedCacheModule,
    CrmModule,
    UserModule,
    BuildersModule,
    PassportModule,
    AffiliateModule,
    PermissionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('AUTH_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow('AUTH_EXPIRE_IN'),
        },
      })
    }),
    IntegrationModule,
  ],
  providers: [
    AuthService,
    PomeloCache,
    JwtStrategy,
    LocalStrategy,
    ApiKeyStrategy,
    PomeloSignatureUtils,
    PomeloHttpUtils,
    SumsubHttpUtils,
    CaslAbilityFactory,
    SumsubSignatureUtils,
    PomeloSignatureGuard,
    SumsubSignatureGuard,
    ApiKeyAffiliateStrategy,
    PomeloProcessConstants,
  ],
  exports: [AuthService, CaslAbilityFactory, PomeloSignatureGuard],
})
export class AuthModule { }
