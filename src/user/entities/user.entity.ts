import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserRoles } from "../enums/role.enum";
import { Product } from "src/products/entities/products.entity";

/**
 * It describes the schema for user table in database.
 */
@Entity({ name: "users" })
export class User {
  /**
   * auto-generated unique uuid primary key for the table.
   */
  @PrimaryGeneratedColumn("uuid")
  @ApiProperty()
  id: string;

  /**
   * googleId of the user user for google auth.
   */
  @Column({ unique: true, default: null })
  @Exclude({ toPlainOnly: true })
  googleID: string;

  /**
   * firstName of user.
   */
  @Column({ length: 50 })
  @ApiProperty()
  firstName: string;

  /**
   * lastName of user.
   */
  @Column({ length: 50 })
  @ApiProperty()
  lastName: string;

  /**
   * email address of user.
   */
  @Column({ unique: true, length: 100 })
  @ApiProperty()
  email: string;
  @Column({ type: "varchar",  nullable: true })
  @ApiProperty()
  image: string;
  /**
   * hashed password of user.
   */
  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  address: string;
  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  phone: string;

  /**
   * role of user. default is UserRoles.USER.
   */
  @Column("enum", { array: true, enum: UserRoles, default: `{${UserRoles.USER}}` })
  @ApiProperty({
    enum: UserRoles,
    default: [UserRoles.USER],
    description: `String array, containing enum values, either ${UserRoles.USER} or ${UserRoles.ADMIN}`,
  })
  roles: UserRoles[]; // NOTE: You can change the size to assign multiple roles to a single user.

  /** 
   * timestamp for date of user creation.
   */
  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  /**
   * timestamp for date of user information updation.
   */ 
  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;

  /**
   * timestamp for date of user soft-delete
   */
  @DeleteDateColumn()
  @ApiProperty()
  deletedAt: Date;

  @OneToMany(() => Product, (product) => product.user_id)
  products: Product[];

}
