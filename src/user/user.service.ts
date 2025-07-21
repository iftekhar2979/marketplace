import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { MailService } from "../mail/mail.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { InjectLogger } from "../shared/decorators/logger.decorator";

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

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    return user;
  }

  /**
   * it updates the user information as per provided information.
   * @param updateUserDto user information that needs to be updated.
   * @param user user information of current logged in user.
   * @returns updated user information
   */
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
}
