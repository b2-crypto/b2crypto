import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-headerapikey';
import { AuthService } from '../auth.service';

import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(authService: AuthService) {
    super(
      {
        header: 'b2crypto-key',
        prefix: '',
      },
      true,
      async (apiKey, done) => {
        const user = await authService.getUserByApiKey(apiKey);
        const exception = !user ? new UnauthorizedException() : null;
        done(exception, !user ? null : user);
      },
    );
  }
}
