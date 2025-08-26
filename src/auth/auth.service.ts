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
import { Otp, OtpType } from "src/otp/entities/otp.entity";
import { OtpVerificationDto } from "./dto/otp-verification.dto";
import { OtpService } from "src/otp/otp.service";
import { use } from "passport";
import { Wallets } from "src/wallets/entity/wallets.entity";


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
    @InjectRepository(Wallets) private walletRepo:Repository<Wallets>,
    private readonly otpService:OtpService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @InjectLogger() private readonly logger: Logger
  ) {
    this.FR_HOST = configService.get<string>(`FR_BASE_URL`);
  }
  async signup(createUserDto: CreateUserDto, req: Request): Promise<{ user: User; token: string }> {
    this.logger.log(`Create and Save user with email ${createUserDto.email}`, AuthService.name);
    let { password } = createUserDto;
    password = await argon2hash(password); 
    try {
      const activateToken: string = tokenCreate();
      let user = this.userRepository.create({ ...createUserDto, password });

      user = await this.userRepository.save(user);
      this.logger.log("User Created", AuthService.name);

      await this.verificationRepository.insert({
        user_id:user.id,
        is_email_verified:false,
        is_deleted:false,
        is_seller_verified:false,
        status:AccountStatus.INACTIVE,
      })
    const otp =  await this.otpService.createOtp(user.id, OtpType.REGISTRATION);
    try{
    const wal =  await this.walletRepo.insert({user_id:user.id,balance:0.00,version:1,user:user})
console.log(wal)
    }catch(err){
      console.log(err)
    }
    this.logger.log("Login the user and send the token and mail", AuthService.name); 
    const token: string = await this.signTokenSendEmailAndSMS(user, req,otp.otp);

      return { user, token };
    } catch (err) {
      this.logger.error(err.message, err.stack, AuthService.name);
      if (err.code === "23505") throw new ConflictException("Email already exists");
      else throw new InternalServerErrorException(err.message);
    }
  }

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
  async OtpVerify(otpDto: OtpVerificationDto,userInfo:User) {
    const { otp,verification_type } = otpDto;
    this.logger.log("Creating Verification", AuthService.name);
    const verification = await this.otpService.findOtpByUserId(userInfo.id);
       if (!verification) {
      throw new NotFoundException("OTP not found or expired");
    }
    if(verification.attempts >= 3) {
      await this.otpService.removeOtpByUserId(userInfo.id);
      throw new BadRequestException("Too many attempts, please request a new OTP");
    }
    if( verification.otp !== otp) {  
      await this.otpService.updateOtpAttempts(userInfo.id, verification.attempts + 1);
      throw new BadRequestException("Invalid OTP");
    }
    if( verification.type !== verification_type) { 
      throw new BadRequestException("Wrong Verification Request");
    }
    if (!verification || (await verification).expiresAt < new Date()) {
      throw new NotFoundException("OTP expired");
    }
    const verifications = await this.verificationRepository.findOne({where:{user_id:userInfo.id}})
    if( verification.type === OtpType.FORGOT_PASSWORD) {
      const user = await this.userRepository.findOne({ where: { id:userInfo.id } }) as any;
      if (!user) {
        throw new NotFoundException("User not found");
      }
      user.verification_type = OtpType.FORGOT_PASSWORD;
      const token = this.jwtService.sign({ id:user.id, verification_type:OtpType.FORGOT_PASSWORD });
         verifications.is_email_verified = true;
    verifications.status = AccountStatus.ACTIVE;
    await this.verificationRepository.save(verifications);
      return { message: "OTP verified successfully", data:{},token };
    }
    if(!verifications){
      throw new NotFoundException("Verification not found");
    }
    verifications.is_email_verified = true;
    verifications.status = AccountStatus.ACTIVE;
    await this.verificationRepository.save(verifications);
    return {message: "OTP verified successfully", data:{},status:"success"};
  }
  async resetPassword(resetPasswordDto: ResetPasswordDto, user) {
const { password, passwordConfirm } = resetPasswordDto;
    if (password !== passwordConfirm) {
      throw new BadRequestException("Password does not match with passwordConfirm");
    }
    this.logger.log("Masking Password", AuthService.name);
    console.log(user)
    const userinfo = await this.userRepository.findOne({ where: { id: user.id } });
    if (!user) {
      throw new NotFoundException("User not found");   
    }
    if (user.verification_type !== OtpType.FORGOT_PASSWORD) {
      throw new BadRequestException("Invalid verification type for password reset");
    }
  const isPassMatched = await argon2verify(userinfo.password, password);
    if (isPassMatched) {
      throw new BadRequestException("New password cannot be the same as the old password");
    }
    this.logger.log("Hashing Password", AuthService.name);
0
    const hashedPassword = await argon2hash(password);
    userinfo.password = hashedPassword; 
    this.logger.log("Saving Updated User", AuthService.name);
    await this.userRepository.save(userinfo);
    return { message: "Password reset successfully", status: "success", data: null };
  }
  async loginPassport(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    this.logger.log("Searching User with provided email", AuthService.name);
    const user = await this.userRepository.findOne({ where: { email } });
// console.log(user)
    this.logger.log("Verifying User", AuthService.name);
    if (user && (await argon2verify(user.password, password))) {
      const verification = await this.verificationRepository.findOne({where:{user_id:user.id}}) 
      if(!verification?.is_email_verified){
        await this.otpService.createOtp(user.id, OtpType.REGISTRATION);
        const token = this.jwtService.sign({id: user.id, verification_type: OtpType.REGISTRATION});
        return token
        // throw new NotAcceptableException("Please verify your email to login")
      }
      this.logger.log("User Verified", AuthService.name);
      return user;
    }

    return null;
  }

  async appleLogin(token: string) {
    if (!token) throw new BadRequestException("Token Not Found");

    const { sub: userId, email, auth_time: loginTime } = this.jwtService.decode(token);
    return {
      user: { userId, email, loginTime },
      token,
    };
  }
  
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
    const token: string = await this.jwtService.sign(user);

    return { user, token };
  }


  async deleteMyAccount(user: User): Promise<boolean> {
    // TODO: Method to be implemented by developer
    throw new BadRequestException("Method not implemented.");
  }
  async userNotAccepted({existingToken}:{existingToken:string}){
      const payload = await this.jwtService.verify(existingToken);
const token = await this.jwtService.sign({id:payload.id,verification_type:OtpType.REGISTRATION})
const userinfo = await this.userRepository.findOne({where:{id:payload.id}});

const otp = await this.otpService.createOtp(payload.id, OtpType.REGISTRATION);
await this.mailService.sendUserConfirmationMail(userinfo, `${otp.otp}`);
return token
  }

  async signToken(user: any): Promise<string> {
    // console.log(user)
    const payload: JwtPayload = { id: user.id };
    this.logger.log("Signing token", AuthService.name);
if(!user.firstName){
  // console.log(payload)
  const payload = { id: user.id, verification_type: 'registration' };
  
  return this.jwtService.sign(payload);
}
    return this.jwtService.sign(payload);
  }

   async signTokenSendEmailAndSMS(user: User, req: Request, verificationCode: string) {
    const token: string = await this.signToken(user);

    this.logger.log("Sending welcome email", AuthService.name);
    this.mailService.sendUserConfirmationMail(user, verificationCode);

    // TODO: Send confirmation SMS to new user using Twilio

    return token;
  }
  async resendOtp({ user ,otpType}:{ user?:any,otpType?:OtpType}) {
  
    if(!user.verification_type || otpType === OtpType.REGISTRATION) {
      const otp = await this.otpService.createOtp(user.id, OtpType.REGISTRATION);
       await this.mailService.sendUserConfirmationMail(user.email, `${otp.otp}`);
     return { message: "OTP resent successfully", status: "success", data:null};
    }
 
    this.logger.log(`Resending OTP to user with ID: ${user.id}`, AuthService.name);
    const existingOtp = await this.otpService.findOtpByUserId(user.id);
    // console.log("Existing Otp",existingOtp.createdAt.getTime()+ 1 * 60 * 1000,Date.now())
     if (existingOtp?.createdAt) {
    const now = Date.now();
    const otpCreatedAt = existingOtp.createdAt.getTime();
    const timeDifference = Date.now() - otpCreatedAt
    if (timeDifference < 1000*60) {
      throw new BadRequestException("You can only request a new OTP after 1 minute.");
    }

    await this.otpService.removeOtpByUserId(user.id);
  }
 
    const otp = await this.otpService.createOtp(user.id, OtpType.FORGOT_PASSWORD);
    await this.mailService.sendForgotPasswordMail(user.email, `${otp.otp}`);
    return { message: "OTP resent successfully", status: "success", data:null};
  }

  async forgetPassword(req:Request,email:string) {
    const user = await this.userRepository.findOne({ where: { email } }) as any;
    user.verification_type = OtpType.FORGOT_PASSWORD;
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const token = await this.jwtService.sign({id: user.id, verification_type: OtpType.FORGOT_PASSWORD});
  await this.resendOtp({ user});
   return { message: "Forgot password email sent successfully", status: "success", data: null ,token};
  }

  async sendOtp(req: Request) {
    const user = req.user as User;
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const existingOtp = await this.otpService.findOtpByUserId(user.id);
    if (existingOtp) {
      // If an OTP already exists, you might want to delete it before generating a new one
      await this.otpService.removeOtpByUserId(user.id); // Ensure to remove the existing OTP
    }
  await this.otpService.createOtp(user.id, OtpType.REGISTRATION);
    return { message: "OTP resent successfully", status: "success", data:null};
  }
  async uploadImage({imageUrl,user}:{imageUrl:string,user:User}) {
    const updateUser = await this.userRepository.update(user.id, { image: imageUrl });
    if (!updateUser) {
      throw new NotFoundException("User not found");
    }
    return { message: "Image uploaded successfully", status: "success", data: null}
  }

}