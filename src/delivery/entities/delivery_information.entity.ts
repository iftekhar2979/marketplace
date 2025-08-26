import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Max, Min } from 'class-validator';
import { Order } from 'src/orders/entities/order.entity';

@Entity('delivery_address')
export class DeliveryAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  forename: string;

  @Column('varchar')
  surname: string;

  @Column('varchar')
  emailAddress: string;

  @Column('varchar')
  companyName: string;

  @Column('varchar')
  addressLineOne: string;

  @Column('varchar')
  city: string;

  @Column('varchar')
  postcode: string;

  @Column('varchar')
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
