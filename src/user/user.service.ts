import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { MailService } from "../mail/mail.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { InjectLogger } from "../shared/decorators/logger.decorator";
import { CreateAdminDto } from "src/auth/dto/create-user.dto";
import { argon2hash } from "src/utils/hashes/argon2";

/**
 * This service contain contains methods and business logic related to user.
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectLogger() private readonly logger: Logger,
    private readonly mailService: MailService
) {}

  async getAllUsers(): Promise<User[]> {
    this.logger.log("getting all users data", UserService.name);
    const users = await this.userRepository.find();

    return users;
  } 
  async createSuperAdmin(body:CreateAdminDto): Promise<string> {
    //  let { password } = body;
    body.password = await argon2hash(body.password); 
    // console.log(body)
    const user = this.userRepository.insert(body); 

    return "Admin Created Successfully"
  }

  async getUserById(id: string): Promise<User> {
    // console.log(id)
    const user = await this.userRepository.findOne(
      { where: { id } ,
      // relations:['verfications'],
      select: ["id", "firstName", "lastName", "email", "roles"] });
   console.log(user)
    return user;
  }
  async getUser(id:string){
   return await this.userRepository.findOneByOrFail({ id })
  }
  async getUserByEmail(email:string){
   return await this.userRepository.findOne({where:{email}})
  }
  async getMultipleUserByIds(userIds:string[]){
 return await this.userRepository.findByIds(userIds);
  }

  async updateUserData(updateUserDto: UpdateUserDto, user: User) {
    let isUpdated: boolean = false;

    this.logger.log(`Checking if user exists`, UserService.name);
    const currentUser = await this.userRepository.findOne({ where: { id: user.id } });

    if (!currentUser) throw new NotFoundException("User Not Found");

    this.logger.log(`Attempting to update user data`, UserService.name);
    Object.keys(currentUser).forEach((key) => {
      if (updateUserDto[key] !== undefined && currentUser[key] !== updateUserDto[key]) {
        currentUser[key] = updateUserDto[key];
        isUpdated = true;
        this.logger.log(`Updated ${key} from ${currentUser[key]} to ${updateUserDto[key]}`, UserService.name);
      }
    });

    if (!isUpdated) {
      this.logger.log(`User didn't update any data`, UserService.name);
      return user;
    }

    this.logger.log(`Save Updated User`, UserService.name);
    await this.userRepository.save(currentUser);

    this.logger.log("Sending update Confirmation Mail", UserService.name);
    this.mailService.sendConfirmationOnUpdatingUser(user);

    return currentUser;
  }
  async updateImage({imageUrl, user}: {imageUrl: string, user: User}) {
    this.logger.log(`Updating user image`, UserService.name);
    const updatedUser = await this.userRepository.update(user.id, { image: imageUrl });
    
    if (!updatedUser) {
      throw new NotFoundException("User not found");
    }

    this.logger.log(`Image updated successfully`, UserService.name);
    return { message: "Image uploaded successfully", status: "success", data: null };
  }
  async updateUserUpdatedTimeAndOfflineStatus({user_id,user}: {user_id: string, user?: Partial<User>}) {
    this.logger.log(`Updating user Active Status`, UserService.name);
    const updatedUser = await this.userRepository.update(user_id, { isActive:false});
    
    if (!updatedUser) {
      throw new NotFoundException("User not found");
    }

    return updatedUser
  }
}
