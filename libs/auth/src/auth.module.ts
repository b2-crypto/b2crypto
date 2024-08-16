import { jwtConstants } from '@auth/auth/constants/auth.constant';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '@user/user';
import { CrmModule } from '@crm/crm';
import { AffiliateModule } from '@affiliate/affiliate';
import { ApiKeyStrategy } from './strategies/api.key.strategy';
import { BuildersModule } from '@builder/builders';
import { ApiKeyAffiliateStrategy } from './strategies/api.key.affiliate.strategy';
import { CaslAbilityFactory } from './casl-ability.factory';
import { PermissionModule } from '@permission/permission';
import { IntegrationModule } from '@integration/integration';
import { PomeloSignatureGuard } from './guards/pomelo.signature.guard';
import { PomeloProcessConstants } from '@common/common/utils/pomelo.integration.process.constants';
import { SignatureUtils } from '@common/common/utils/pomelo.integration.process.signature';
import { PomeloHttpUtils } from '@common/common/utils/pomelo.integration.process.http.utils';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { SumsubSignatureGuard } from './guards/sumsub.signature.guard';
import { SumsubHttpUtils } from '@common/common/utils/sumsub.integration.process.http.utils';
import { SumsubSignatureUtils } from '@common/common/utils/sumsub.integration.process.signature';

@Module({
  imports: [
    CrmModule,
    UserModule,
    BuildersModule,
    PassportModule,
    AffiliateModule,
    PermissionModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: {
        expiresIn: jwtConstants.expiresIn,
      },
    }),
    IntegrationModule,
  ],
  providers: [
    AuthService,
    PomeloCache,
    JwtStrategy,
    LocalStrategy,
    ApiKeyStrategy,
    SignatureUtils,
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
export class AuthModule {}
