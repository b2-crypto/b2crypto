import { SumsubProcessHeaderDto } from '@integration/integration/identity/generic/domain/dto/sumsub.process.header.dto';
import { SumsubEnum } from '@integration/integration/identity/generic/domain/sumsub.enum';
import { ExecutionContext, Injectable } from '@nestjs/common';

import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class SumsubHttpUtils {
  extractRequestHeaders(context: ExecutionContext): SumsubProcessHeaderDto {
    const request = context.switchToHttp().getRequest();
    const headers: SumsubProcessHeaderDto = {
      digestAlgorithm:
        request.headers[SumsubEnum.SUMSUB_HEADER_DIGEST_ALGORITHM],
      digest: request.headers[SumsubEnum.SUMSUB_HEADER_DIGEST],
    };
    return headers;
  }
}
