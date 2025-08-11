import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/user/entities/user.entity';

export enum DeliveryStatus {
  PENDING = 'pending',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('deliveries')
export class Delivery {
  @ApiProperty({ example: 1, description: 'Unique ID for the delivery' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 101, description: 'Order ID associated with this delivery' })
  @Column()
  order_id: number;

  @ApiProperty({ example: 'uuid-of-buyer', description: 'User ID of the recipient (buyer)' })
  @Column()
  user_id: string;

  @ApiProperty({ example: 'pending', enum: DeliveryStatus, description: 'Current status of the delivery' })
  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status: DeliveryStatus;

  @ApiProperty({ example: '123 Main St, NY', description: 'Delivery address' })
  @Column()
  address: string;

  @ApiProperty({ example: 'DHL', description: 'Courier name or service used' })
  @Column({ nullable: true })
  courier?: string;

  @ApiProperty({ example: 'TRK12345678', description: 'Tracking number (if any)' })
  @Column({ nullable: true })
  tracking_number?: string;

  @ApiProperty({ description: 'Estimated delivery date' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  estimated_delivery_date?: Date;

  @ApiProperty({ description: 'Timestamp when the delivery was created' })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ApiProperty({ description: 'Timestamp when the delivery was last updated' })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // 👉 Relations

  @OneToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
