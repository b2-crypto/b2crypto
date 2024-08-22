import { BuildersModule } from '@builder/builders';
import { MessageModule } from '@message/message';
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessageServiceController } from './message-service.controller';
import { MessageServiceService } from './message-service.service';

@Module({
  imports: [
    MessageModule,
    BuildersModule,
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('AWS_SES_HOST');
        const port = configService.get<number>('AWS_SES_PORT');
        const user = configService.get<string>('AWS_SES_USERNAME');
        const pass = configService.get<string>('AWS_SES_PASSWORD');
        
        return {
          transport: {
            host: host,
            port: port,
            ignoreTLS: false,
            secure: false,
            auth: {
              user: user,
              pass: pass,
            },
          },
          preview: false,
          template: {
            dir: './libs/message/src/templates/',
          },
        };
      }
      
    }),
  ],
  controllers: [MessageServiceController],
  providers: [MessageServiceService],
})
export class MessageServiceModule {}
