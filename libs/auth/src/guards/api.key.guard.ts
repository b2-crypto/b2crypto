import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import {
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class ApiKeyAuthGuard extends AuthGuard('api-key') {
  constructor(
    @InjectPinoLogger(ApiKeyAuthGuard.name)
    protected readonly logger: PinoLogger,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
  ) {
    super();
  }
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const apiKey =
      request.headers['b2crypto-key'] ?? request.query['b2crypto-key'];
    if (!apiKey) {
      throw new UnauthorizedException('Not found client key');
    }
    let client = null;
    try {
      client = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.findOneByApiKey,
        apiKey,
      );
      if (!client || !client.isClientAPI) {
        throw new UnauthorizedException('Not found client with key');
      }
      request['clientApi'] = client._id;
      delete request.headers['checkApiKey'];
      return true;
    } catch (err) {
      this.logger.error('ApiKeyAuthGuard.canActive', err);
      return false;
    }
  }
  handleRequest(err, affiliate /* , info */) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !affiliate) {
      throw err || new UnauthorizedException();
    }
    return affiliate;
  }
}
