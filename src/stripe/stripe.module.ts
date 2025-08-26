import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { WalletsModule } from 'src/wallets/wallets.module';

@Module({
  imports:[

    // TypeOrmModule.forFeature()
    UserModule,
    AuthModule,
    WalletsModule
  ],
  controllers: [StripeController],
  providers: [StripeService,WalletsModule]
})
export class StripeModule {}
