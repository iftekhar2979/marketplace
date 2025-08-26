import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger'; // For Swagger API documentation
import { IsBoolean, IsInt, IsString } from 'class-validator'; // For validation
import { User } from './user.entity';

@Entity('verifications')
export class Verification {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the verification' })
  id: number;

  @Column()
  @ApiProperty({ description: 'User ID associated with the verification' })
  @IsString()
  user_id: string;

  @Column({ default: false })
  @ApiProperty({ description: 'Indicates if the email is verified', default: false })
  @IsBoolean()
  is_email_verified: boolean;
 
 
     @OneToOne(() => User) // Assuming User entity exists
      @JoinColumn({ name: 'user_id' })
      @ApiProperty({ type: () => User })
      user: User;
  @Column({ default: false })
  @ApiProperty({ description: 'Indicates if the seller is verified', default: false })
  @IsBoolean()
  is_seller_verified: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'Indicates if the record is deleted', default: false })
  @IsBoolean()
  is_deleted: boolean;

  @Column({ default: 'active' })
  @ApiProperty({ description: 'Status of the verification', default: 'active' })
  @IsString()
  status: string; 

} 
