import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([Otp]) // Assuming Otp is the entity for OTPs
  ],
  providers: [OtpService]
})
export class OtpModule {}
