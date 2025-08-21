import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsObject, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateShipmentDto {
    @ApiProperty({example:"Order Id"})
    @IsNumber()
    @IsPositive()
    order_id: number
  @ApiProperty({ example: 'SUCCESS', description: 'Status of the shipment' })
  @IsString()
  Status: string;

  @ApiProperty({ example: 'TP-0445469', description: 'Order reference for the shipment' })
  @IsString({message: 'Order reference must be a string'})
  @MinLength(1, { message: 'Order reference must be at least 1 character long' })
  @MaxLength(50, { message: 'Order reference must not exceed 50 characters' })
  orderReference: string;

  @ApiProperty({ example: '[URL STRING]', description: 'Tracking URL for the shipment' })
  @IsString()
  @MinLength(1, { message: 'Tracking URL must be at least 1 character long' })
  @MaxLength(255, { message: 'Tracking URL must not exceed 255 characters' })
  trackingURL: string;

  @ApiProperty({ description: 'Order Invoice for the shipment' })
  @IsObject()
  orderInvoice: {
    TotalNet: number;
    Tax: number;
    TotalGross: number;
  };

  @ApiProperty({ description: 'Labels for the shipment' })
  labels: {
    LabelRole: string;
    LabelFormat: string;
    AirWaybillReference: string;
    DownloadURL: string;
  }[];

  @ApiProperty()
  documents: {
    DocumentType: string;
    Format: string;
    DownloadURL: string;
  }[];
}
