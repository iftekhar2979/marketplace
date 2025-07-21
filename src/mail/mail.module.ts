import { MailerModule } from "@nestjs-modules/mailer";
import { PugAdapter } from "@nestjs-modules/mailer/dist/adapters/pug.adapter";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailService } from "./mail.service";
import { join } from "path";
import { FROM_EMAIL } from "./constants";

/**
 * It is a feature module where we keep the service and code related to mails. we import the nestjs mailer module and configure it to work with templates using pugAdapter.
 */
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        if (configService.get<string>("NODE_ENV") === "DEV") {
          return {
            transport: {
              host: configService.get<string>("EMAIL_HOST"),
              port: +configService.get<string>("EMAIL_PORT"),
              auth: {
                user: configService.get<string>("EMAIL_USERNAME"),
                pass: configService.get<string>("EMAIL_PASSWORD"),
              },
            },
            defaults: {
              from: `'no-reply' <${FROM_EMAIL}>`,
            },
            template: {
              dir: join(__dirname, "templates"),
              adapter: new PugAdapter(), // NOTE: change to your preferable adapter
              options: {
                strict: true,
              },
            },
          };
        }
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
