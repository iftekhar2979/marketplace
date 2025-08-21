import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipments.entity';
import { OrderInvoice } from './entities/shipment_order_invoice.entity';
import { Label } from './entities/shipment_lable.entity';
// import { CreateShipmentDto } from './dto/createShipment.dto';
import { ShipmentDocument } from './entities/shipment_document.entity';
import { CreateShipmentDto } from './dto/createShipment.dto';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class ShipmentService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(OrderInvoice)
    private orderInvoiceRepository: Repository<OrderInvoice>,
    @InjectRepository(Label)
    private labelRepository: Repository<Label>,
    @InjectRepository(ShipmentDocument)
    private documentRepository: Repository<ShipmentDocument>,
    private readonly orderService: OrdersService
  ) {}

  // Create a new shipment with transaction handling
  async create(createShipmentDto:CreateShipmentDto): Promise<Shipment> {
    // Start a new transaction
    const order = await this.orderService.findOrder({id:createShipmentDto.order_id});
    // console.log(order)
    const queryRunner = this.shipmentRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // 1. Create the Shipment entity
      const shipment = new Shipment();
      shipment.Status = createShipmentDto.Status;
      shipment.orderReference = createShipmentDto.orderReference;
      shipment.trackingURL = createShipmentDto.trackingURL;
      shipment.order = order; // Assuming order is already fetched

      // Save the shipment
      const savedShipment = await queryRunner.manager.save(Shipment, shipment);
      // 2. Create related entities (OrderInvoice, Label, Document) inside the transaction
      // Order Invoice
      if (createShipmentDto.orderInvoice) {
        const orderInvoice = new OrderInvoice();
        orderInvoice.TotalNet = createShipmentDto.orderInvoice.TotalNet;
        orderInvoice.Tax = createShipmentDto.orderInvoice.Tax;
        orderInvoice.TotalGross = createShipmentDto.orderInvoice.TotalGross;
        orderInvoice.shipment = savedShipment;

        await queryRunner.manager.save(OrderInvoice, orderInvoice);  // Save OrderInvoice
      }

      // Labels
      if (createShipmentDto.labels && createShipmentDto.labels.length > 0) {
        for (const labelData of createShipmentDto.labels) {
          const label = new Label();
          label.labelRole = labelData.LabelRole;
          label.labelFormat = labelData.LabelFormat;
          label.airWaybillReference = labelData.AirWaybillReference;
          label.downloadURL = labelData.DownloadURL;
          label.shipment = savedShipment;
          await queryRunner.manager.save(Label, label);  // Save Label
        }
      }

      // Documents
      if (createShipmentDto.documents && createShipmentDto.documents.length > 0) {
        for (const documentData of createShipmentDto.documents) {
          const document = new ShipmentDocument();
          document.documentType = documentData.DocumentType;
          document.format = documentData.Format;
          document.downloadURL = documentData.DownloadURL;
          document.shipment = savedShipment;

          await queryRunner.manager.save(ShipmentDocument, document);  // Save Document
        }
      }

      // Commit the transaction after all entities are saved
      await queryRunner.commitTransaction();

      // Return the saved shipment
    //  savedShipment;
    const shipments = await this.shipmentRepository.findOne({
      where: { id: savedShipment.id },
      relations: ['order', 'orderInvoice', 'labels', 'documents'],
    });
      if (!shipments) {
        throw new Error('Shipment not found after creation');
      }
    //   console.log(shipments)    
     return shipments;

    } catch (error) {
        console.log(error)
      // If any error occurs, rollback the transaction
      await queryRunner.rollbackTransaction();
      throw new Error('Error occurred while creating the shipment and its related entities.');
    } finally {
      // Release the query runner to free up resources
      await queryRunner.release();
    }
  }
}
