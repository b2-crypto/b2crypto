import { Injectable } from '@nestjs/common';

import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class IntegrationServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
