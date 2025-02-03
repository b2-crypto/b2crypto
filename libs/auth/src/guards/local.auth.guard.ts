import { Traceable } from '@amplication/opentelemetry-nestjs';
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Traceable()
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
