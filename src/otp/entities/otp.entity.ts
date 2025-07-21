import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsInt, IsString } from "class-validator";
import { User } from "src/user/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({name:"otps"})
export class Otp {
    @PrimaryGeneratedColumn('increment')
    @ApiProperty()
    id: number;

    @Column({ type: 'varchar', length: 4})  // Store OTP as a string (typically 6 digits)
    @ApiProperty()
    @IsString()  // Validate that OTP is a string
    otp: string;

    @Column({ type: 'string' })
    @ApiProperty()
    @IsString()  // Validate that userId is an integer
    user_id: string;

    @ManyToOne(() => User) // Assuming User entity exists
    @JoinColumn({ name: 'user_id' })
    @ApiProperty({ type: () => User })
    user: User;

    @Column({ type: 'timestamp' })
    @ApiProperty()
    @IsDate()  // Ensure expiresAt is a valid date
    expiresAt: Date;
}