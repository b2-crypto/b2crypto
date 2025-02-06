import { Traceable } from '@amplication/opentelemetry-nestjs';
import { Injectable } from '@nestjs/common';

@Traceable()
@Injectable()
export class SecurityServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
