import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Wallets } from './entity/wallets.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Transections } from 'src/transections/entity/transections.entity';
import { TransectionType } from 'src/transections/enums/transectionTypes';
import { PaymentStatus } from 'src/orders/enums/orderStatus';
import { ResponseInterface } from 'src/common/types/responseInterface';
import { InjectLogger } from 'src/shared/decorators/logger.decorator';
import { Logger } from 'winston';
import { BullQueueEvent, BullQueueEvents, InjectQueue } from '@nestjs/bull';
import Bull from 'bull';
import { Queue } from 'bullmq';

@Injectable()
export class WalletsService {
    constructor(
private readonly dataSource: DataSource, 
@InjectRepository(Wallets) private readonly walletRepository: Repository<Wallets>,
// @InjectRepository(User) private readonly userRepository: Repository<User>,
@InjectRepository(Transections) private readonly transectionRepository: Repository<Transections>,
// @InjectQueue('wallet_queue') private bullQueue: Queue,
    @InjectLogger() private readonly logger: Logger
    ) {}
        
  // Wallet Recharge Service
  async rechargeWallet({userId,amount,paymentMethod,transectionId}:{userId: string; amount: number; paymentMethod: string; transectionId: string}){
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }
    // Start a transaction to ensure data integrity
    const queryRunner = this.walletRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const wallet = await queryRunner.manager.findOne(Wallets, { where: { user_id: userId } });
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }
      // Update wallet balance
      wallet.balance += amount;
      await queryRunner.manager.save(Wallets, wallet);

      // Record the transaction
      const transection = new Transections();
      transection.user_id = userId;
      transection.amount = amount;
      transection.transection_type = TransectionType.RECHARGE; // Credit for recharge
      transection.transectionId = transectionId;
      transection.paymentMethod = paymentMethod;
      transection.status = PaymentStatus.COMPLETED;
      transection.wallet_id = wallet.id;

      await queryRunner.manager.save(Transections, transection);

      // Commit the transaction
      await queryRunner.commitTransaction();

      return { message: 'Wallet recharged successfully', balance: wallet.balance };
    } catch (error) {
      // If any error occurs, rollback the transaction
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
}

async getWalletByUserId(userId:string):Promise<ResponseInterface<Wallets>>{
  // console.log(userId)
  const wallet = await this.walletRepository.findOne({where:{user_id:userId}});
  // const bul = await this.bullQueue.add('Added',wallet)
  // console.log(bul)
  // this.logger.error("Balance detect",wallet.balance)
  if(!wallet){
    throw new NotFoundException('Wallet not found');
  }
  return { message:"wallets retrived successfully",status:'success',statusCode:200,data:wallet};
}
  // Wallet Withdraw Service
  async withdrawFromWallet(userId: string, amount: number, transectionId: string, paymentMethod: string): Promise<any> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }
    // Start a transaction to ensure data integrity
    const queryRunner = this.walletRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(Wallets, { where: { user_id: userId } });
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }
      if (wallet.balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }
      wallet.balance -= amount;
      await queryRunner.manager.save(Wallets, wallet);

      const transection = new Transections();
      transection.user_id = userId;
      transection.amount = amount;
      transection.transection_type = TransectionType.WITHDRAW; // Debit for withdrawal
      transection.transectionId = null;
      transection.paymentMethod = paymentMethod;
      transection.status = PaymentStatus.PENDING;
      transection.wallet_id = wallet.id;

      await queryRunner.manager.save(Transections, transection);

      // Commit the transaction
      await queryRunner.commitTransaction();

      return { message: 'Withdrawal successful', balance: wallet.balance };
    } catch (error) {
      // If any error occurs, rollback the transaction
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }
    
}
