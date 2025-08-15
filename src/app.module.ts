import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { WinstonModule } from "nest-winston";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { LoggerMiddleware } from "./shared/middlewares/logger.middleware";
import { envSchema } from "./utils/env.validation";
import { AuthModule } from "./auth/auth.module";
import { MailModule } from "./mail/mail.module";
import { PostgreSQLDatabaseModule } from "./database/postgresql.module";
import { UserModule } from "./user/user.module";
import { HealthModule } from "./health/health.module";
import { winstonLoggerConfig } from "./configs/winston.config";
import { S3Module } from "./s3/s3.module";
import { SseModule } from "./sse/sse.module";
import { OtpModule } from './otp/otp.module';
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ProductsModule } from './products/products.module';
import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { SearchModule } from './search/search.module';
import { FavouritesModule } from './favourites/favourites.module';
import { OffersModule } from './offers/offers.module';
import { OrdersModule } from './orders/orders.module';
import { DeliveryModule } from './delivery/delivery.module';
import { CategoryModule } from './category/category.module';
import { SizesModule } from './sizes/sizes.module';
import { WalletsModule } from './wallets/wallets.module';
import { TransectionsModule } from './transections/transections.module';
import { WithdrawsService } from './withdraws/withdraws.service';
import { WithdrawsModule } from './withdraws/withdraws.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { ParticipantsModule } from './participants/participants.module';
import { AttachmentModule } from './attachment/attachment.module';
import { SeederModule } from './seeder/seeder.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SocketModule } from './socket/socket.module';

/**
 * It is the root module for the application in we import all feature modules and configure modules and packages that are common in feature modules. Here we also configure the middlewares.
 *
 * Here, feature modules imported are - DatabaseModule, AuthModule, MailModule and UserModule.
 * other modules are :
 *      {@link ConfigModule} - enables us to access environment variables application wide.
 *      {@link TypeOrmModule} - it is an ORM and enables easy access to database.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.stage.dev`],
      isGlobal: true,
      validationSchema: envSchema,
      // validationOptions: { allowUnknown: false, abortEarly: true },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: +config.get<string>("THROTTLE_TTL"),
          limit: +config.get<string>("THROTTLE_LIMIT"),
        },
      ],
    }),
    // ElasticsearchModule.register({
    //   node: `${process.env.ELASTICSEARCH_NODE}`, // Your Elasticsearch node URL
    // }),
     ElasticsearchModule.register({
      node: 'https://localhost:9200',
      auth: {
        username: 'elastic',
        password: 'zLOt2va9_fUKmX0kN3xD',
      },
    tls:{
      rejectUnauthorized: false, // This is for development purposes only, do not use in production
    }
    }),
    WinstonModule.forRoot(winstonLoggerConfig),
    PostgreSQLDatabaseModule,
    AuthModule,
    MailModule,
    UserModule,
    HealthModule,
    S3Module,
    SseModule,
    OtpModule,
    ProductsModule,
    SearchModule,
    FavouritesModule,
    OffersModule,
    OrdersModule,
    DeliveryModule,
    CategoryModule,
    SizesModule,
    WalletsModule,
    TransectionsModule,
    WithdrawsModule,
    ConversationsModule,
    MessagesModule,
    ParticipantsModule,
    AttachmentModule,
    SeederModule,
    NotificationsModule,
    SocketModule,
  
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    WithdrawsService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("/**");
  }
}
