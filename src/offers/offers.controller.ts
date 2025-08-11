import { Body, Controller, Param, Post, UploadedFiles, UseGuards } from '@nestjs/common';
import { OfferService } from './offers.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtAuthenticationGuard } from 'src/auth/guards/session-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { OfferDto, SendOfferDto } from './dto/sendOffer.dto';
import { User } from 'src/user/entities/user.entity';

@Controller('offers')
export class OffersController {
    constructor(
        private readonly offerService:OfferService
    ){

    }
    @Post('send')
    @UseGuards(JwtAuthenticationGuard)
    async createOffer(
        @Body() offer:OfferDto,
        @GetUser() user : User ,
      ) {
        const {product_id,price}=offer
        return this.offerService.createOffer({buyer_id:user.id,product_id,price})
      }
    @Post(':id/accept')
    @UseGuards(JwtAuthenticationGuard)
    async acceptOffer(
        @Param('id') id:string ,
        @GetUser() user : User ,
      ) {
        return this.offerService.acceptOffer({offerId:Number(id),sellerId:user.id})
      }


}
