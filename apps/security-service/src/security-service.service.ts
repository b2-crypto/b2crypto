import { Injectable } from '@nestjs/common';

import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class SecurityServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
