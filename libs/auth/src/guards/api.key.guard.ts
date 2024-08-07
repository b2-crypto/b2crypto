import { BuildersService } from '@builder/builders';
import {
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
@Injectable()
export class ApiKeyAuthGuard extends AuthGuard('api-key') {
  constructor(
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
    const client = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.findOneByApiKey,
      apiKey,
    );
    if (!client) {
      throw new UnauthorizedException('Not found client with key');
    }
    request['clientApi'] = client._id;
    delete request.headers['checkApiKey'];
    return true;
  }
  handleRequest(err, affiliate /* , info */) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !affiliate) {
      throw err || new UnauthorizedException();
    }
    return affiliate;
  }
}
