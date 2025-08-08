import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from 'src/orders/entities/order.entity';
import { OfferStatus } from '../enums/offerStatus.enum';

@Entity('offers')
export class Offer {
  @ApiProperty({ example: 1, description: 'Unique ID of the offer' })
  @PrimaryGeneratedColumn()
  id: number;

 @ApiProperty({ example: 123, description: 'Associated order entity' })
  @ManyToOne(() => Order, (order) => order.offers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' }) // Optional: ensures FK column is named `order_id`
  order: Order;

  @ApiProperty({ example: 99.99, description: 'Offered price' })
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ example: 'pending', description: 'Status of the offer (e.g., pending, accepted, rejected)' })
  @Column({ default: 'pending' })
  status: OfferStatus;

  @ApiProperty({ description: 'Timestamp when the offer was created' })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ApiProperty({ description: 'Timestamp when the offer was last updated' })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;


}