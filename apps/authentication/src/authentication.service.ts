import { Injectable } from '@nestjs/common';

import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class AuthenticationService {
  getHello(): string {
    return 'Hello World!';
  }
}
