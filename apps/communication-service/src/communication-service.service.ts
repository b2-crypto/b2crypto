import { Injectable } from '@nestjs/common';

import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class CommunicationServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
