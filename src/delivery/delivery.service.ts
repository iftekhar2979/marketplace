import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryAddress } from './entities/delivery_information.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeliveryAddressDto, UpdateDeliveryAddressDto } from './dto/createDelivery.dto';

@Injectable()
export class DeliveryService {
      constructor(
    @InjectRepository(DeliveryAddress)
    private readonly deliveryAddressRepository: Repository<DeliveryAddress>,
  ) {}
  async createDeliveryAddress(createDeliveryAddressDto: CreateDeliveryAddressDto): Promise<DeliveryAddress> {
    try {
      const deliveryAddress = this.deliveryAddressRepository.create(createDeliveryAddressDto);
      return await this.deliveryAddressRepository.save(deliveryAddress);
    } catch (error) {
      throw new BadRequestException('Error creating delivery address');
    }
  }
  async updateDeliveryAddress(id: number, updateDeliveryAddressDto: UpdateDeliveryAddressDto): Promise<DeliveryAddress> {
    const deliveryAddress = await this.deliveryAddressRepository.findOne({where:{id}});
    if (!deliveryAddress) {
      throw new NotFoundException('Delivery address not found');
    }
    Object.assign(deliveryAddress, updateDeliveryAddressDto);

    try {
      return await this.deliveryAddressRepository.save(deliveryAddress);
    } catch (error) {
      throw new BadRequestException('Error updating delivery address');
    }
  }

  // Get Delivery Address by ID
  async getDeliveryAddressById(id: number): Promise<DeliveryAddress> {
    const deliveryAddress = await this.deliveryAddressRepository.findOne({where:{id}});
    if (!deliveryAddress) {
      throw new NotFoundException('Delivery address not found');
    }
    return deliveryAddress;
  }

  // Delete Delivery Address
  async deleteDeliveryAddress(id: number): Promise<void> {
    const deliveryAddress = await this.deliveryAddressRepository.findOne({where:{id}});
    if (!deliveryAddress) {
      throw new NotFoundException('Delivery address not found');
    }

    try {
      await this.deliveryAddressRepository.remove(deliveryAddress);
    } catch (error) {
      throw new BadRequestException('Error deleting delivery address');
    }
  }
}
