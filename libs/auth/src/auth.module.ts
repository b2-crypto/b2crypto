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
import { Constants } from 'apps/integration-service/src/utils/pomelo.integration.process.constants';
import { SignatureUtils } from 'apps/integration-service/src/utils/pomelo.integration.process.signature';
import { HttpUtils } from 'apps/integration-service/src/utils/pomelo.integration.process.http.utils';
import { SignatureGuard } from './guards/pomelo.signature.guard';

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
    CaslAbilityFactory,
    ApiKeyAffiliateStrategy,
    ApiKeyStrategy,
    LocalStrategy,
    JwtStrategy,
    Constants,
    SignatureUtils,
    HttpUtils,
  ],
  exports: [AuthService, CaslAbilityFactory, SignatureGuard],
})
export class AuthModule {}
