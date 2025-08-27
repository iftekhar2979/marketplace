import { Module } from '@nestjs/common';
import { BullService } from './bull.service';
import { BullController } from './bull.controller';

@Module({
  providers: [BullService],
  controllers: [BullController]
})
export class BullModule {}
