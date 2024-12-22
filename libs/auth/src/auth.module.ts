import { AffiliateModule } from '@affiliate/affiliate';
import { jwtConstants } from '@auth/auth/constants/auth.constant';
import { BuildersModule } from '@builder/builders';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { PomeloProcessConstants } from '@common/common/utils/pomelo.integration.process.constants';
import { PomeloHttpUtils } from '@common/common/utils/pomelo.integration.process.http.utils';
import { PomeloSignatureUtils } from '@common/common/utils/pomelo.integration.process.signature';
import { SumsubHttpUtils } from '@common/common/utils/sumsub.integration.process.http.utils';
import { SumsubSignatureUtils } from '@common/common/utils/sumsub.integration.process.signature';
import { CrmModule } from '@crm/crm';
import { IntegrationModule } from '@integration/integration';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { CacheModule } from '@nestjs/cache-manager';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PermissionModule } from '@permission/permission';
import { UserModule } from '@user/user';
import { redisStore } from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';
import { AuthService } from './auth.service';
import { CaslAbilityFactory } from './casl-ability.factory';
import { PomeloSignatureGuard } from './guards/pomelo.signature.guard';
import { SumsubSignatureGuard } from './guards/sumsub.signature.guard';
import { ApiKeyAffiliateStrategy } from './strategies/api.key.affiliate.strategy';
import { ApiKeyStrategy } from './strategies/api.key.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const config = {
          store: redisStore,
          username: configService.getOrThrow('REDIS_USERNAME'),
          password: configService.getOrThrow('REDIS_PASSWORD'),
          host: configService.getOrThrow('REDIS_HOST'),
          port: configService.getOrThrow<number>('REDIS_PORT'),
          ttl: parseInt(configService.getOrThrow('CACHE_TTL') ?? '20') * 1000,
          max: parseInt(configService.getOrThrow('CACHE_MAX_ITEMS')),
          isGlobal: true,
        } as RedisClientOptions;
        if (configService.getOrThrow('ENVIRONMENT') !== EnvironmentEnum.prod) {
          Logger.log(config, 'Redis Config');
        }
        return config;
      },
      inject: [ConfigService],
    }),
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
export class AuthModule {}
