import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';

export const CORRELATION_ID_HEADER = 'X-Correlation-Id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    const uuid = randomUUID();

    req.headers[CORRELATION_ID_HEADER] = uuid;
    res.header(CORRELATION_ID_HEADER, uuid);

    next();
  }
}
