import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notifications } from './entities/notifications.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports:[
TypeOrmModule.forFeature([Notifications]),
AuthModule
  ],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports:[NotificationsService]
})
export class NotificationsModule {}
