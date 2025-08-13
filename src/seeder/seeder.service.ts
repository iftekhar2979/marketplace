// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { CreateAdminDto, CreateUserDto } from 'src/auth/dto/create-user.dto';
import { UserRoles } from 'src/user/enums/role.enum';
import { UserService } from 'src/user/user.service';

// import {IUser} from '../../users/users.interface'; // Your user interface
// import { CreateUserDto } from './dto/create-user.dto'; // DTO for creating a user

@Injectable()
export class SeederService {
  constructor(
    private readonly userService: UserService,
    // private readonly settingService: SettingsService,
    // @InjectModel(Settings.name) private settingModel: Model<Settings>,
  ) {}

  async seedAdminUser() {
    const adminEmail = 'admin@petAttix.com'; // Use a valid email
    const adminPassword =  '1qaAzxsw2@'
    const existingAdmin = await this.userService.getUserByEmail("admin@petAttix.com")

    let date = new Date();
    if (!existingAdmin) {
        const adminDto: CreateAdminDto = {
            firstName:'Mr.',
            lastName :"Admin", 
            address: 'Nothing' ,
            phone : '+8801837352979',
          email: adminEmail,
          password: adminPassword, 
          roles:[ UserRoles.ADMIN], 
           
        };
console.log(adminDto)
      await this.userService.createSuperAdmin(adminDto); // Assuming create method is in your UserService
      console.log('Admin user created successfully!');
    } else {
      console.log('Admin user already exists.');
    }
  }
async seedData() {
    const seedData = [
      {
        key: 'privacy_policy',
        content: `
          **Privacy Policy**
          Effective Date: 12-28-2024
          Vibley ("we," "our," "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application or website. Please read this policy carefully to understand our views and practices regarding your personal data.
          ...
        `,
      },
      {
        key: 'about_us',
        content: `
          **About Us**
          Welcome to Vibley!
          At [Your Company Name], we are dedicated to [briefly describe your mission or purpose]. Our goal is to [state your company's primary objective or vision].
          ...
        `,
      },
      {
        key: 'terms_and_condition',
        content: `
          **Terms and Conditions**
          Effective Date: 12-28-2024
          Welcome to Vibley! By using our services, you agree to comply with and be bound by the following terms and conditions.
          ...
        `,
      },
    ];
  }
}
