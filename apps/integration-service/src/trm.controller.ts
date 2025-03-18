import { Traceable } from '@amplication/opentelemetry-nestjs';
import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { SumsubConfigEnum } from '@integration/integration/enum/sumsub.config.enum';
import {
    Controller,
    HttpCode,
    HttpStatus,
    Post
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Controller('TRM Consumer')
export class eventListenerTrmController {
    constructor(
        @InjectPinoLogger(eventListenerTrmController.name)
        protected readonly logger: PinoLogger,
    ) { }

    @Post(SumsubConfigEnum.SUMSUB_NOTIFICATION_REVIEWED_PATH)
    @ApiKeyCheck()
    @HttpCode(HttpStatus.OK)
    async handleNotificationReviewed(
    ) {

    }


}
