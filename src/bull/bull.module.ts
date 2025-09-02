import { Module } from '@nestjs/common';
import { BullService } from './bull.service';
import { BullController } from './bull.controller';
import { ImageProcessor } from './processors/ProductQueue';

@Module({
  providers: [BullService,],
  controllers: [BullController]
})
export class BullModule {}
