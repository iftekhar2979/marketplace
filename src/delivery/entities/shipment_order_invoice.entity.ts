import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Shipment } from './shipments.entity';

@Entity('order_invoices')
export class OrderInvoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  TotalNet: number;

  @Column('decimal', { precision: 10, scale: 2 })
  Tax: number;

  @Column('decimal', { precision: 10, scale: 2 })
  TotalGross: number;

  @ManyToOne(() => Shipment, (shipment) => shipment.orderInvoice)
  shipment: Shipment;  // Link back to Shipment
}
