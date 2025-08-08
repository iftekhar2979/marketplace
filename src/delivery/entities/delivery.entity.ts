import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('deliveries')
export class Delivery{
    @ApiProperty({example: 1, description: 'Unique ID of the delivery'  })
    @PrimaryGeneratedColumn()
    id:number;

    @ApiProperty({example: 'Id Of Order', description: 'ID of the order associated with this delivery'})
    @Column()
    order_id : string ;
}