import { Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { Type } from 'class-transformer';
import { Wallets } from './entity/wallets.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { Product } from 'src/products/entities/products.entity';
import { ProductBoosts } from 'src/product-boost/entities/product-boost.entity';
import { Transections } from 'src/transections/entity/transections.entity';
import { ProductsModule } from 'src/products/products.module';
import { Order } from 'src/orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallets,ProductBoosts,Transections , Order,Product]),
    UserModule ,
    ProductsModule
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports:[WalletsService]
})
export class WalletsModule {}
