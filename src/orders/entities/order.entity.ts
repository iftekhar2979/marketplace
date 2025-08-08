// order.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/products/entities/products.entity';
import { Offer } from 'src/offers/entities/offer.entity';
import { User } from 'src/user/entities/user.entity';
import { OrderStatus } from '../enums/orderStatus';


@Entity('orders')
export class Order {
  @ApiProperty({ example: 1, description: 'Unique ID for the order' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'uuid-of-buyer', description: 'Buyer user ID' })
  @Column()
  buyer_id: string;

  @ApiProperty({ example: 'uuid-of-seller', description: 'Seller user ID' })
  @Column()
  seller_id: string;

  @ApiProperty({ example: 12, description: 'Product ID being purchased' })
  @Column()
  product_id: number;

  @ApiProperty({ example: 'pending', description: 'Status of the order (pending, confirmed, delivered, etc.)' })
  @Column({ default: 'pending' })
  status: OrderStatus;

  @ApiProperty({ description: 'Timestamp when the order was created' })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ApiProperty({ description: 'Timestamp when the order was last updated' })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // 👤 Buyer relation (optional)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'buyer_id' }) 
  buyer: User;

  // 👤 Seller relation (optional)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
   @JoinColumn({ name: 'seller_id' })
  seller: User;

  // 📦 Product relation
   @ManyToOne(() => Product, (product) => product.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
  // 💬 Offers related to this order
  @OneToMany(() => Offer, (offer) => offer.order ,  { cascade: true })
  offers: Offer[];

  // 🚚 Delivery (optional placeholder)
  @ApiProperty({ example: 'pickup', description: 'Delivery method or status' })
  @Column({ nullable: true })
  delivery: OrderStatus |  null;
}
