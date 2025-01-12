import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
