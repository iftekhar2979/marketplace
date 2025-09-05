import { Module } from '@nestjs/common';
import { BullService } from './bull.service';
import { BullController } from './bull.controller';
import { ImageProcessor } from './processors/ProductQueue';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { UserBehaviourModule } from 'src/user-behaviour/user-behaviour.module';

@Module({
  imports:[ UserBehaviourModule],
  providers: [BullService,],
  controllers: [BullController]
})
export class BullModule {}
