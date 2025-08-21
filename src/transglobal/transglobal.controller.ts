import { Body, Controller, Post } from '@nestjs/common';
import { TransglobalService } from './transglobal.service';
import { CreateServiceDto } from './dto/create_courier_details.dto';

@Controller('transglobal')
export class TransglobalController {

     constructor(private readonly transglobalService: TransglobalService) {}

  @Post()
  async create(@Body() createServiceDto: CreateServiceDto) {
    return this.transglobalService.createService(createServiceDto);
  }
}
