import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { SocketController } from './socket.controller';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SocketGateway } from './socket.gateway';
import { MessagesModule } from 'src/messages/messages.module';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { ParticipantsModule } from 'src/participants/participants.module';


@Module({
  imports:[
    AuthModule,
    UserModule,
     PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            return {
              secret: configService.get<string>("JWT_SECRET"),
              signOptions: {
                expiresIn: configService.get<string>("EXPIRES_IN"),
              },
            };
          },
        }),

        MessagesModule,
        ConversationsModule,
        ParticipantsModule
  ], 
  providers: [SocketGateway, SocketService], 
  controllers: [SocketController]
})
export class SocketModule {}
