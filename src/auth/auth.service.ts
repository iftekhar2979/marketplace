import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MailService } from "../mail/mail.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { JwtPayload } from "./dto/jwt-payload.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UpdateMyPasswordDto } from "./dto/update-password.dto";
import { User } from "../user/entities/user.entity";
import { argon2hash, argon2verify } from "../utils/hashes/argon2";
import { sha256, tokenCreate } from "../utils/hashes/hash";
import { InjectLogger } from "../shared/decorators/logger.decorator";
import { Verification } from "src/user/entities/verification.entity";
import { AccountStatus, CreateVerificationDto } from "src/user/dto/verification-dto";
import { generateOtp } from "src/otp/generate-otp";
import { Otp } from "src/otp/entities/otp.entity";
import { OtpVerificationDto } from "./dto/otp-verification.dto";

/**
 * This service contain contains all methods and business logic for authentication such as login, signup, password reset, etc.
 */
@Injectable()
export class AuthService {
  private _FR_HOST: string;

  /**
   *  returns the frontend host URL.
   */
  public get FR_HOST(): string {
    return this._FR_HOST;
  }

  /**
   *  used to set the frontend host URL.
   *  @param value the URL to the frontend host.
   */
  public set FR_HOST(value: string) {
    this._FR_HOST = value;
  }

  /**
   * Constructor of `AuthService` class
   * @param userRepository
   * @param jwtService imported from "@nestjs/jwt"
   * @param mailService
   * @param configService
   */
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Verification) private verificationRepository:Repository<Verification>,
    @InjectRepository(Otp) private otpRepository:Repository<Otp>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @InjectLogger() private readonly logger: Logger
  ) {
    this.FR_HOST = configService.get<string>(`FR_BASE_URL`);
  }

  /**
   * used for signing up the user and send mail with activation token to the given email for account activation.
   * @param createUserDto object containing user information.
   * @param req HTTP request object.
   * @returns user object containing information about user and token which is used for authentication.
   */
  async signup(createUserDto: CreateUserDto, req: Request): Promise<{ user: User; token: string }> {
    this.logger.log(`Create and Save user with email ${createUserDto.email}`, AuthService.name);

    let { password } = createUserDto;
    password = await argon2hash(password); // NOTE: Hash the password

    try {
      // NOTE: Generate user activating token
      const activateToken: string = tokenCreate();

      let user = this.userRepository.create({ ...createUserDto, password });

      user = await this.userRepository.save(user);
      this.logger.log("User Created", AuthService.name);

      const verification = this.verificationRepository.insert({
        user_id:user.id,
        is_email_verified:false,
        is_deleted:false,
        is_seller_verified:false,
        status:AccountStatus.INACTIVE,

      })
      const generatedOtp =generateOtp(4)
     await this.otpRepository.insert({otp:generatedOtp, user_id: user.id, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });

      this.logger.log("Login the user and send the token and mail", AuthService.name);
      const token: string = await this.signTokenSendEmailAndSMS(user, req,generatedOtp);

      return { user, token };
    } catch (err) {
      this.logger.error(err.message, err.stack, AuthService.name);
      if (err.code === "23505") throw new ConflictException("Email already exists");
      else throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * used for user account activation by comparing the given token with activeToken hash in user object.
   * @param token activation token that is sent to the user during signup.
   * @returns true | false
   */
  // async activateAccount(token: string) {
  //   console.log("Token",token)
  //   this.logger.log("Generating token", AuthService.name);
  //   const hashedToken = sha256(token);

  //   this.logger.log("Searching User with activation token", AuthService.name);
  //   const user = await this.userRepository.findOne({ where: { activeToken: hashedToken } });

  //   if (!user) throw new BadRequestException("Invalid token or token expired");

  //   this.logger.log("Activate Account", AuthService.name);

  //   await this.userRepository.save(user);

  //   //NOTE: FOR UI
  //   const profile = `${this.FR_HOST}/accounts/profile`;

  //   this.logger.log("Send account activation mail to user", AuthService.name);
  //   this.mailService.sendUserAccountActivationMail(user, profile);

  //   return true;
  // }
 
  /**
   * used by passport for authentication by finding the user and matching password.
   * @param loginUserDto object containing email and phone of a user.
   * @returns if authenticated it returns user object otherwise returns null
   */
  async verfication(verificationDto: CreateVerificationDto): Promise<Verification> {
    const { user_id, is_email_verified, is_seller_verified, is_deleted, status } = verificationDto;

    this.logger.log("Creating Verification", AuthService.name);
    const verification = this.verificationRepository.create({
      user_id,
      is_email_verified,
      is_seller_verified,
      is_deleted,
      status,
    });

    return await this.verificationRepository.save(verification);
  }
  async OtpVerify(otpDto: OtpVerificationDto) {
    const { user_id,otp } = otpDto;

    this.logger.log("Creating Verification", AuthService.name);
    const verification = this.otpRepository.findOne({
      where: { user_id: user_id, otp: otp  },
    }) as Promise<Otp>;
       if (!verification) {
      throw new NotFoundException("OTP not found or expired");
    }
     // Check if the OTP exists and if it is still valid (i.e., not expired)
    if (!verification || (await verification).expiresAt < new Date()) {
      throw new NotFoundException("OTP not found or expired");
    }
    return {message: "OTP verified successfully", data:{}};
 
  }
  async loginPassport(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    this.logger.log("Searching User with provided email", AuthService.name);
    const user = await this.userRepository.findOne({ where: { email } });

    this.logger.log("Verifying User", AuthService.name);
    if (user && (await argon2verify(user.password, password))) {
      return user;
    }

    return null;
  }

  /**
   * used by passport for google authentication.
   * @param req http request object containing user details provided by google.
   * @returns user object containing information about user and token which is used for authentication.
   */
  // async loginGoogle(req: Request) {
  //   if (!req.user) {
  //     throw new NotFoundException("User Not Found");
  //   }

  //   const { existingUser, sendMail, newUser, activateToken } = await this.createOrFindUserGoogle(req.user);

  //   let user: User, token: string;
  //   if (existingUser) user = existingUser;
  //   else user = newUser;

  //   if (sendMail) {
  //     token = await this.signTokenSendEmailAndSMS(user, req, activateToken);
  //   } else {
  //     this.logger.log("Existing User, Logging In", AuthService.name);
  //     token = await this.signToken(user);
  //   }

  //   return {
  //     user,
  //     token,
  //   };
  // }

  /**
   * used by Apple Authentication
   * NOTE:
   * You need to deploy the backend and frontend first, if locally, then use ngrok
   * @param req http request object containing user details provided by google.
   * @returns user object containing information about user and token which is used for authentication.
   */
  async appleLogin(token: string) {
    if (!token) throw new BadRequestException("Token Not Found");

    const { sub: userId, email, auth_time: loginTime } = this.jwtService.decode(token);

    console.log("DECODED:", { userId, email, loginTime });

    return {
      user: { userId, email, loginTime },
      token,
    };
  }

  /**
   * sends password reset token to given email for resetting password if user account associated to that email is found.
   * @param email email associated with user account
   * @param req HTTP request object.
   * @returns signed token which is used for authentication.
   */
  // async forgotPassword(email: string, req: Request) {
  //   this.logger.log("Searching User with provided email", AuthService.name);
  //   const user = await this.userRepository.findOne({ where: { email } });

  //   if (!user) {
  //     throw new NotFoundException("User Not Found");
  //   }

  //   this.logger.log("Creating password reset token", AuthService.name);
  //   const { user: updatedUser, resetToken } = this.createPasswordResetToken(user);

  //   await this.userRepository.save(updatedUser);

  //   const resetURL = `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${resetToken}`;
  //   //NOTE: FOR UI
  //   // const resetURL = `${req.protocol}://${req.get("host")}/resetPassword/${resetToken}`;
  //   // const resetURL = `${thcreateOrFindUserGoogleis.FR_HOST}/auth/reset-password/${resetToken}`;

  //   try {
  //     this.logger.log("Sending password reset token mail", AuthService.name);
  //     this.mailService.sendForgotPasswordMail(email, resetURL);

  //     return true;
  //   } catch (err) {
  //     user.passwordResetToken = null;
  //     user.passwordResetExpires = null;

  //     await this.userRepository.save(user);
  //     return false;
  //   }
  // }

  /**
   * verifies the given password rest token by comparing it with token stored in user object and making sure it's not expired.
   * @param token password reset token that is sent over the mail to the user in forgotPassword.
   * @returns a string "valid token" if the token is valid.
   */
  // async verifyToken(token: string) {
  //   this.logger.log("Generating hash from token", AuthService.name);
  //   const hashedToken = sha256(token);

  //   this.logger.log("Retrieving user", AuthService.name);
  //   const user: User = await this.userRepository.findOne({ where: { passwordResetToken: hashedToken } });

  //   if (!user) throw new BadRequestException("The user belonging to this token doesn't exist");

  //   this.logger.log("Checking if token is valid", AuthService.name);
  //   const resetTime: number = +user.passwordResetExpires;
  //   if (Date.now() >= resetTime) {
  //     throw new BadRequestException("Invalid token or token expired");
  //   }

  //   return "valid token";
  // }

  /**
   * used to reset user password. it verifies the given password reset token and if verified updates the user password.
   * @param token password reset token that is sent over the mail to the user in forgotPassword.
   * @param resetPassword contains new password to be set.
   * @returns a string "valid token" if the token is valid.
   */
  // async resetPassword(token: string, resetPassword: ResetPasswordDto) {
  //   const { password, passwordConfirm } = resetPassword;

  //   this.logger.log("Checking Password equality", AuthService.name);
  //   if (password !== passwordConfirm) {
  //     throw new NotAcceptableException("password and passwordConfirm should match");
  //   }

  //   this.logger.log("Generating hash from token", AuthService.name);
  //   const hashedToken = sha256(token);

  //   this.logger.log("Retrieving user", AuthService.name);
  //   const user: User = await this.userRepository.findOne({ where: { passwordResetToken: hashedToken } });

  //   if (!user) throw new BadRequestException("Invalid token or token expired");

  //   this.logger.log("Checking if token is valid", AuthService.name);
  //   const resetTime: number = +user.passwordResetExpires;
  //   if (Date.now() >= resetTime) {
  //     throw new BadRequestException("Invalid token or token expired");
  //   }

  //   this.logger.log("Hashing the password", AuthService.name);
  //   user.password = await argon2hash(password);

  //   user.passwordResetExpires = null;
  //   user.passwordResetToken = null;

  //   this.logger.log("Update the user password", AuthService.name);
  //   const updatedUser: User = await this.userRepository.save(user);

  //   const newToken: string = await this.signToken(updatedUser);

  //   this.logger.log("Sending reset password confirmation mail", AuthService.name);
  //   this.mailService.sendPasswordResetConfirmationMail(user);

  //   return { updatedUser, newToken };
  // }

  /**
   * used to update user password. it verifies the current user password and update the new password.
   * @param updateMyPassword password reset token that is sent over the mail to the user in forgotPassword.
   * @param user user object containg user information of current logged in user.
   * @returns updated user object containing user information and token which is used for authentication.
   */
  async updateMyPassword(updateMyPassword: UpdateMyPasswordDto, user: User) {
    const { passwordCurrent, password, passwordConfirm } = updateMyPassword;

    this.logger.log("Verifying current password from user", AuthService.name);
    if (!(await argon2verify(user.password, passwordCurrent))) {
      throw new UnauthorizedException("Invalid password");
    }

    if (password === passwordCurrent) {
      throw new BadRequestException("New password and old password can not be same");
    }

    if (password !== passwordConfirm) {
      throw new BadRequestException("Password does not match with passwordConfirm");
    }

    this.logger.log("Masking Password", AuthService.name);
    const hashedPassword = await argon2hash(password);
    user.password = hashedPassword;

    this.logger.log("Saving Updated User", AuthService.name);
    await this.userRepository.save(user);

    this.logger.log("Sending password update mail", AuthService.name);
    this.mailService.sendPasswordUpdateEmail(user);

    this.logger.log("Login the user and send the token again", AuthService.name);
    const token: string = await this.signToken(user);

    return { user, token };
  }

  /**
   * used for deleting user account. Method implementation to be completed by developer.
   * @param user user object containg user information of current logged in user.
   * @returns updated user object containing user information and token which is used for authentication.
   */
  async deleteMyAccount(user: User): Promise<boolean> {
    // TODO: Method to be implemented by developer
    throw new BadRequestException("Method not implemented.");
  }

  /**
   * sends account activation URL in a mail to the logged in user.
   * @param user user object containg user information of current logged in user.
   * @param req HTTP request object.
   * @returns updated user object containing user information and token which is used for authentication.
   */
  // async sendAccountActivationMail(user: User, req: Request) {
  //   this.logger.log("Creating token", AuthService.name);
  //   const activateToken: string = tokenCreate();

  //   this.logger.log("Generating and saving token hash", AuthService.name);
  //   user.activeToken = sha256(activateToken);

  //   await this.userRepository.save(user);

  //   this.logger.log("Creating activation url", AuthService.name);
  //   const activeURL = `${req.protocol}://${req.get("host")}/api/v1/auth/activate/${activateToken}`;
  //   //NOTE: FOR UI
  //   // const activeURL = `${req.protocol}://${req.get("host")}/activate/${activateToken}`;
  //   // const activeURL = `${this.FR_HOST}/auth/activate/${activateToken}`;

  //   this.logger.log("Sending activtion mail", AuthService.name);
  //   this.mailService.sendUserActivationToken(user, activeURL);

  //   return "success";
  // }

  /**
   * used for signing a JWT token with user id as payload.
   * @param user http request object containing user details provided by google.
   * @returns signed token which is used for authentication.
   */
  async signToken(user: any): Promise<string> {
    const payload: JwtPayload = { id: user.id };
    this.logger.log("Signing token", AuthService.name);

    return this.jwtService.sign(payload);
  }

  /**
   * sends account activation URL in a welcome mail to the given user.
   * @param user user object containg user information.
   * @param activateToken account activation token.
   * @param req HTTP request object.
   * @returns signed JWT token which is used for authentication.
   */
  private async signTokenSendEmailAndSMS(user: User, req: Request, verificationCode: string) {
    const token: string = await this.signToken(user);

    //NOTE: FOR UI
    // const activeURL = `${req.protocol}://${req.get("host")}/activate/${activateToken}`;
    // const activeURL = `${this.FR_HOST}/auth/activate/${activateToken}`;

    this.logger.log("Sending welcome email", AuthService.name);
    this.mailService.sendUserConfirmationMail(user, verificationCode);

    // TODO: Send confirmation SMS to new user using Twilio

    return token;
  }

  /**
   * it creates password reset token and saves it in user object.
   * @param user user object containing user information.
   * @returns created password reset token.
   */
  // private createPasswordResetToken(user: User): { user: User; resetToken: string } {
  //   const resetToken: string = tokenCreate();

  //   user.passwordResetToken = sha256(resetToken);

  //   const timestamp = Date.now() + 10 * 60 * 1000; // NOTE: 10 mins to reset password
  //   user.passwordResetExpires = timestamp.toString();

  //   return { user, resetToken };
  // }

  /**
   * it checks for user in DB and if not found, creates and saves new user object in database. it is used for google authentication
   * @param user user information provided by google.
   * @returns newly created user object and activation token
   */
  // private async createOrFindUserGoogle(user: any) {
  //   const existingUser = await this.userRepository.findOne({ where: { googleID: user.id } });

  //   if (existingUser) return { existingUser, sendMail: false };

  //   const activateToken: string = tokenCreate();

  //   let newUser = new User();
  //   newUser.googleID = user.id;
  //   newUser.firstName = user.firstName;
  //   newUser.lastName = user.lastName;
  //   newUser.email = user.email;
  //   newUser.activeToken = sha256(activateToken);

  //   try {
  //     newUser = await this.userRepository.save(newUser);
  //   } catch (err) {
  //     if (err.code === "23505") throw new ConflictException("User already exists");
  //     else throw new InternalServerErrorException();
  //   }

  //   return { newUser, activateToken, sendMail: true };
  // }
}
