import { Traceable } from '@amplication/opentelemetry-nestjs';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-headerapikey';
import { AuthService } from '../auth.service';

@Traceable()
@Injectable()
export class ApiKeyAffiliateStrategy extends PassportStrategy(
  Strategy,
  'api-key-affiliate',
) {
  constructor(authService: AuthService) {
    super(
      {
        header: 'b2crypto-affiliate-key',
        prefix: '',
      },
      true,
      async (apiKey, done) => {
        const affiliate = await authService.getAffiliateByPublicKey(apiKey);
        const exception = !affiliate ? new UnauthorizedException() : null;
        done(exception, affiliate);
      },
    );
  }
}
