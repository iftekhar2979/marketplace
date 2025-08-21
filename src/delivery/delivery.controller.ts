import { Body, Controller, Post } from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { CreateShipmentDto } from './dto/createShipment.dto';

@Controller('delivery')
export class DeliveryController {

     constructor(private readonly shipmentService: ShipmentService) {}

  // Endpoint to create a new shipment
  @Post('shipment')
  async create(@Body() createShipmentDto: CreateShipmentDto) {
    return this.shipmentService.create(createShipmentDto);
  }
}
