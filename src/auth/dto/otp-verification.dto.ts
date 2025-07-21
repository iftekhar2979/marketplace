
import { ApiProperty } from "@nestjs/swagger";
import { IS_LENGTH, IsNotEmpty, IsString, Length } from "class-validator";

export class OtpVerificationDto {
    /**
     * Email of user
     */
    @ApiProperty({ required: true, description: "One Time Password Is Required" })
    @IsNotEmpty()
    @IsString({ message: 'OTP must be a string' })
    @Length(4, 4, { message: 'OTP must be exactly 4 characters long' })
    otp: string;
     @ApiProperty({ required: true, description: "User Id Is Required" })
    @IsNotEmpty()
    @IsString({ message: 'user_id is requried' })
    // @Length(4, 4, { message: 'OTP must be exactly 4 characters long' })
    user_id: string;

}
