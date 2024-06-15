import { BuildersModule } from '@builder/builders';
import { MessageModule } from '@message/message';
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { MessageServiceController } from './message-service.controller';
import { MessageServiceService } from './message-service.service';

@Module({
  imports: [
    MessageModule,
    BuildersModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.AWS_SES_HOST,
        port: process.env.AWS_SES_PORT,
        ignoreTLS: false,
        secure: false,
        auth: {
          user: process.env.AWS_SES_SMTP_USERNAME,
          pass: process.env.AWS_SES_SMTP_PASSWORD,
        },
      },
      preview: false,
      template: {
        dir: './libs/message/src/templates/',
      },
    }),
  ],
  controllers: [MessageServiceController],
  providers: [MessageServiceService],
})
export class MessageServiceModule {}
