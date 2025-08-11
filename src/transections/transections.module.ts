import { Module } from '@nestjs/common';
import { TransectionsController } from './transections.controller';
import { TransectionsService } from './transections.service';

@Module({
  controllers: [TransectionsController],
  providers: [TransectionsService]
})
export class TransectionsModule {}
