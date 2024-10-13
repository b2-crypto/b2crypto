import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { BuildersService } from '@builder/builders';
import { IntegrationService } from '@integration/integration';
import { Body, Controller, Inject, Logger, Post, Req } from '@nestjs/common';
import * as crypto from 'crypto';

@Controller('fireblocks')
//@UseGuards(ApiKeyAuthGuard)
export class FireBlocksNotificationsController {
  private publicKey = `-----BEGIN PUBLIC KEY-----
  MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA0+6wd9OJQpK60ZI7qnZG
  jjQ0wNFUHfRv85Tdyek8+ahlg1Ph8uhwl4N6DZw5LwLXhNjzAbQ8LGPxt36RUZl5
  YlxTru0jZNKx5lslR+H4i936A4pKBjgiMmSkVwXD9HcfKHTp70GQ812+J0Fvti/v
  4nrrUpc011Wo4F6omt1QcYsi4GTI5OsEbeKQ24BtUd6Z1Nm/EP7PfPxeb4CP8KOH
  clM8K7OwBUfWrip8Ptljjz9BNOZUF94iyjJ/BIzGJjyCntho64ehpUYP8UJykLVd
  CGcu7sVYWnknf1ZGLuqqZQt4qt7cUUhFGielssZP9N9x7wzaAIFcT3yQ+ELDu1SZ
  dE4lZsf2uMyfj58V8GDOLLE233+LRsRbJ083x+e2mW5BdAGtGgQBusFfnmv5Bxqd
  HgS55hsna5725/44tvxll261TgQvjGrTxwe7e5Ia3d2Syc+e89mXQaI/+cZnylNP
  SwCCvx8mOM847T0XkVRX3ZrwXtHIA25uKsPJzUtksDnAowB91j7RJkjXxJcz3Vh1
  4k182UFOTPRW9jzdWNSyWQGl/vpe9oQ4c2Ly15+/toBo4YXJeDdDnZ5c/O+KKadc
  IMPBpnPrH/0O97uMPuED+nI6ISGOTMLZo35xJ96gPBwyG5s2QxIkKPXIrhgcgUnk
  tSM7QYNhlftT4/yVvYnk0YcCAwEAAQ==
  -----END PUBLIC KEY-----`.replace(/\\n/g, '\n');
  constructor(
    private readonly builder: BuildersService,
    @Inject(IntegrationService)
    private integrationService: IntegrationService,
  ) {}
  //private readonly integrationServiceService: PomeloIntegrationProcessService,

  // ----------------------------
  @AllowAnon()
  @Post('webhook')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async webhook(@Req() req: any, @Body() data: any) {
    Logger.debug(data, 'FireblocksNotificationsController.webhook');
    Logger.debug(
      req.headers,
      'FireblocksNotificationsController.webhook:request.headers',
    );
    Logger.debug(
      req.body,
      'FireblocksNotificationsController.webhook:request.body',
    );
    const isVerified = this.verifySign(req);
    return {
      statusCode: 200,
      data: isVerified ? 'ok' : 'fail',
    };
  }

  private verifySign(req) {
    const message = JSON.stringify(req.body);
    const signature = req.headers['fireblocks-signature'];

    const verifier = crypto.createVerify('RSA-SHA512');
    verifier.write(message);
    verifier.end();

    const isVerified = verifier.verify(this.publicKey, signature, 'base64');
    Logger.log('Verified:', isVerified);
    return isVerified;
  }
}
