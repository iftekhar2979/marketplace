import { Body, Controller, Get, Param, Patch, Session, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { GetFileDestination, GetUser } from "../auth/decorators/get-user.decorator";
import { User } from "./entities/user.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UpdateProfilePictureDto, UpdateUserDto } from "./dto/update-user.dto";
import { AccountActivatedGuard } from "./guards/account-activation.guard";
import { UserService } from "./user.service";
import { ApiResponseDto, CountApiResponseDto } from "../shared/dto/base-response.dto";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { multerConfig, multerS3Config } from "src/common/multer/multer.config";
import { JwtAuthenticationGuard } from "src/auth/guards/session-auth.guard";

/**
 * UserController is responsible for handling incoming requests specific to User and returning responses to the client.
 * It creates a route - "/user"
 */
@Controller("users")
@UseGuards(JwtAuthGuard)
@ApiTags("User")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: "In case user is not logged in" })
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get("all")
  @ApiOperation({
    description: "Api to fetch details of all users.",
    summary: "Api to fetch details of all users.",
  })
  @ApiOkResponse({ description: "Get list of all users in Database", type: CountApiResponseDto<User[]>, isArray: true })
  async getAllUsers(): Promise<CountApiResponseDto<User[]>> {
    const users = await this.userService.getAllUsers();

    return { status: "success", count: users.length, data: users };
  }

  /**
   * Get API - "/me" - Get data about current logged in user
   * @param user user information of the current logged in user.
   * @returns returns the user object.
   * @throws UnauthorizedException with message in case user is not logged in.
   */
  @Get("me")
  @ApiOperation({
    description: "Api to fetch details of logged in user.",
    summary: "Api to fetch details of logged in user.",
  })
  @ApiOkResponse({ description: "Get data about current logged in user", type: ApiResponseDto<User> })
  async getUser(@GetUser() user: User): Promise<ApiResponseDto<User>> {
    return { status: "success", data: user };
  }

  /**
   * Patch API - "/update-me" - it updates user details as per the request body.
   * @param user user information of the current logged in user.
   * @param updateUserDto contains request body data.
   * @returns returns the updated user object and response status.
   * @throws UnauthorizedException in case user is not logged in.
   * @throws ForbiddenException if the account is not activated.
   */
  @Patch("update-me")
  @UseGuards(AccountActivatedGuard)
  @ApiOperation({
    description: "Api to update user details.",
    summary: "Api to update user details.",
  })
  @ApiOkResponse({ description: "Update User Data", type: ApiResponseDto<User> })
  @ApiForbiddenResponse({ description: "If the account is not activated" })
  async updateUserDetails(@Body() updateUserDto: UpdateUserDto, @GetUser() user: User): Promise<ApiResponseDto<User>> {
    const updatedUser = await this.userService.updateUserData(updateUserDto, user);

    return { status: "success", data: updatedUser };
  }
  @Patch("upload-image")
  @UseGuards(JwtAuthenticationGuard)
    @UseInterceptors(FileInterceptor('image',multerConfig))
  @ApiOperation({
    description: "Api to update user Profile Picture",
    summary: "Api to update user Profile Picture.",
  })
  @ApiOkResponse({ description: "Update User Data", type: ApiResponseDto<User> })
  @ApiForbiddenResponse({ description: "If the account is not activated" })
  async updateProfilePicture(@GetUser() user: User , @GetFileDestination() fileDestination: string) {
   console.log(fileDestination)
    await this.userService.updateImage({ imageUrl: fileDestination, user });

    return { status: "success", data: null, message:"Image updated successfully",statusCode: 200 };
  }
 
  /**
   * Get API - "/:id" - Get data about an user
   * @param id user profile information about an user
   * @returns returns the user object.
   * @throws UnauthorizedException with message in case user is not logged in.
   */
  @Get(":id")
  @ApiOperation({
    description: "Api to fetch profile details of an user",
    summary: "Api to fetch profile details of an user",
  })
  @ApiOkResponse({ description: "Get data about current logged in user", type: ApiResponseDto<User> })
  async getUserById(@Param("id") id: string): Promise<ApiResponseDto<User>> {
    const user = await this.userService.getUserById(id);

    return { status: "success", data: user };
  }
}
