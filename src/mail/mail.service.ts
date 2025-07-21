import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { FROM_EMAIL, ORG_NAME } from "./constants";
import { User } from "../user/entities/user.entity";

@Injectable()
export class MailService {
  /**
   * Organization Name
   */
  private _name: string = ORG_NAME;

  /**
   * getter function for Organization Name
   */
  public get name(): string {
    return this._name;
  }

  /**
   * setter function for Organization Name
   * @param value Name to be set
   */
  public set name(value: string) {
    this._name = value;
  }

  /**
   * email address for sending mails
   */
  private _from: string = FROM_EMAIL;

  /**
   * getter function for from - email address
   */
  public get from(): string {
    return this._from;
  }

  /**
   * setter function for from - email address
   * @param value email address to be set
   */
  public set from(value: string) {
    this._from = value;
  }

  constructor(private readonly mailService: MailerService) {}

  /* 
    NOTE:
        I have put the 2 lines for each mail, wherever you need confirmation of sending mail, un-comment the former with a return and comment the latter 

        You may choose to refactor all the mail methods into a single master method/class and while calling you may pass the template name and context object to use in templates
    */

  /**
   * sends confirmation mail to user's email address with account activation URL
   * @param user user object containing user information
   * @param url account activation URL
   */
  async sendUserConfirmationMail(user: User, url: string) {
    const subject = `Welcome to Your Dance Attix! Hi ${user.firstName}, Here's Your Account Activation Code`;
    // await this.mailService.sendMail({
    this.mailService.sendMail({
      from: { name: this.name, address: this.from },
      to: user.email,
      subject: "",
      template: "welcome",
      context: {
        subject: "",
        header: "",
        firstName: user.firstName,
        lastName: user.lastName,
        url,
      },
    });
  }

  /**
   * sends a mail to user's email address with account activation URL
   * @param user user object containing user information
   * @param url account activation URL
   */
  async sendUserActivationToken(user: User, url: string) {
    // await this.mailService.sendMail({
    this.mailService.sendMail({
      from: { name: this.name, address: this.from },
      to: user.email,
      subject: "",
      template: "account-activation",
      context: {
        subject: "",
        header: "",
        firstName: user.firstName,
        url,
      },
    });
  }

  /**
   * sends a mail to user's email address with URL for account activation confirmation
   * @param user user object containing user information
   * @param url account activation URL
   */
  async sendUserAccountActivationMail(user: User, url: string) {
    // await this.mailService.sendMail({
    this.mailService.sendMail({
      from: { name: this.name, address: this.from },
      to: user.email,
      subject: "",
      template: "confirm-activation",
      context: {
        subject: "",
        header: "",
        firstName: user.firstName,
        url,
      },
    });
  }

  /**
   * sends a mail to user's email address with URL containing password reset token
   * @param email recipient's email address
   * @param url reset password URL
   */
  async sendForgotPasswordMail(email: string, url: string) {
    // await this.mailService.sendMail({
    this.mailService.sendMail({
      from: { name: this.name, address: this.from },
      to: email,
      subject: "",
      template: "forgot-password",
      context: {
        subject: "",
        header: "",
        url,
      },
    });
  }

  /**
   * sends a Password rest confirmation mail to user's email address.
   * @param user user object containing user information
   */
  async sendPasswordResetConfirmationMail(user: User) {
    // await this.mailService.sendMail({
    this.mailService.sendMail({
      from: { name: this.name, address: this.from },
      to: user.email,
      subject: "",
      template: "reset-password",
      context: {
        subject: "",
        header: "",
      },
    });
  }

  /**
   * sends a Password Updated confirmation mail to user's email address.
   * @param user user object containing user information
   */
  async sendPasswordUpdateEmail(user: User) {
    // await this.mailService.sendMail({
    this.mailService.sendMail({
      from: { name: this.name, address: this.from },
      to: user.email,
      subject: `Password Updated!`,
      template: "update-password",
      context: {
        subject: "",
        header: "",
        firstName: user.firstName,
      },
    });
  }

  /**
   * sends a account deletion mail to user's email address.
   * @param user user object containing user information
   */
  async sendUserDeletionMail(user: User) {
    // await this.mailService.sendMail({
    this.mailService.sendMail({
      from: { name: this.name, address: this.from },
      to: user.email,
      subject: "",
      template: "account-deletion",
      context: {
        subject: "",
        header: "",
        firstName: user.firstName,
      },
    });
  }

  /**
   * sends a confirmation mail on updating user information to user's email address.
   * @param user user object containing user information
   */
  async sendConfirmationOnUpdatingUser(user: User) {
    // await this.mailService.sendMail({
    this.mailService.sendMail({
      from: { name: this.name, address: this.from },
      to: user.email,
      subject: "",
      template: "user-updation",
      context: {
        subject: "",
        header: "",
        firstName: user.firstName,
      },
    });
  }
}
