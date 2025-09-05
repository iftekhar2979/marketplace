import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Type } from 'class-transformer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';
import { ProductImage } from './entities/productImage.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { Wallets } from 'src/wallets/entity/wallets.entity';
import { BullModule } from '@nestjs/bull';
import { UserBehaviourModule } from 'src/user-behaviour/user-behaviour.module';
import { Transections } from 'src/transections/entity/transections.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([Product, ProductImage,Wallets,Transections]), 
  AuthModule,
  UserModule,
  UserBehaviourModule,
  NotificationsModule,
  BullModule.registerQueue({name:"product"})],
  
  // BullModule.registerQueue({name:"behaviour"})],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports:[ProductsService]
})
export class ProductsModule {}
