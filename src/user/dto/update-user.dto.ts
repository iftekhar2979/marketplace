import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsAlpha, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { IsNotAdmin } from "../../shared/decorators/not-admin.decorator";

/**
 * request DTO with validations for updateUserDetails API.
 */
export class UpdateUserDto {
  /**
   * First Name of user
   */
  @ApiPropertyOptional({ required: false, description: "First Name of user" })
  @IsNotAdmin()
  @MaxLength(20, { message: "First Name exceeds given length" })
  @MinLength(1, { message: "First name has to be of length 1" })
  @IsAlpha()
  @IsString({ message: "First name must be a string" })
  @IsOptional()
  firstName?: string;

  /**
   * Last Name of user
   */
  @ApiPropertyOptional({ required: false, description: "Last Name of user" })
  @IsNotAdmin()
  @MaxLength(20, { message: "Last Name exceeds given length" })
  @MinLength(1, { message: "Last name has to be of length 1" })
  @IsAlpha()
  @IsString({ message: "Last name must be a string" })
  @IsOptional()
  lastName?: string;
}

export class UpdateProfilePictureDto {
  /**
   * First Name of user
   */
  @ApiPropertyOptional({ required: true, description: "Image url is requied" })
  @IsString({ message: "Image url must be string" })
  image: string;

  
}
