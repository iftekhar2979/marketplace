import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OtpService {
    constructor(
        @InjectRepository(Otp) private otpRepository: Repository<Otp>
    ){

    }
  generateOtp(length: number = 6): string {
    let otp = '';
    
    // Generate a random number for each digit of the OTP
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10); // Generates a random digit (0-9)
    }
  
    return otp;
  }

    async createOtp(userId: string): Promise<Otp> {
        const otp = this.generateOtp(4);
        const newOtp = this.otpRepository.create({
        otp,
        user_id: userId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) 
        });
    
        return await this.otpRepository.save(newOtp);
    }

}
