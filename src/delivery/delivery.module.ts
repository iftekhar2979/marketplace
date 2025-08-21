import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { Shipment } from './entities/shipments.entity';
import { ShipmentService } from './shipment.service';
import { Type } from 'class-transformer';
import { Delivery } from './entities/delivery.entity';
import { ShipmentDocument } from './entities/shipment_document.entity';
import { Label } from './entities/shipment_lable.entity';
import { Order } from 'src/orders/entities/order.entity';
import { OrderInvoice } from './entities/shipment_order_invoice.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([Shipment,Delivery,ShipmentDocument,Label,OrderInvoice]),
    OrdersModule
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService,ShipmentService]
})
export class DeliveryModule {}
