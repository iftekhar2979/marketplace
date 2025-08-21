import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Max, Min } from 'class-validator';
import { Order } from 'src/orders/entities/order.entity';

@Entity('delivery_address')
export class DeliveryAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  forename: string;

  @Column()
  surname: string;

  @Column()
  emailAddress: string;

  @Column()
  companyName: string;

  @Column()
  addressLineOne: string;

  @Column()
  city: string;

  @Column()
  postcode: string;

  @Column()
  telephoneNumber: string;
  @ApiProperty({ example: '112', description: 'County Id' })
   @IsNumber()
    @Min(1)
    @Max(4)
    @Column('int', )
 country_id: number;
    @ApiProperty({ example: 'US', description: 'County Code' })
    @Column('varchar',)
country_code: string;
    @ApiProperty({ example: 'Bangladesh', description: 'County' })
    @IsString()
    @Column('varchar', { nullable: true })
    country: string;
  @ManyToOne(() => Order, (order) => order)
  @JoinColumn({ name: 'order_id' })
  order: Order; // Link Collection Address to Order
}
