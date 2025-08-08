import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { Type } from 'class-transformer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer])
  ],
  controllers: [OffersController],
  providers: [OffersService]
})
export class OffersModule {}
