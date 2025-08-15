import { BadRequestException, Body, Controller, ForbiddenException, NotFoundException, Param, Post, UploadedFiles, UseGuards } from '@nestjs/common';
import { OfferService } from './offers.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtAuthenticationGuard } from 'src/auth/guards/session-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { OfferDto, SendOfferDto } from './dto/sendOffer.dto';
import { User } from 'src/user/entities/user.entity';
import { ResponseInterface } from 'src/common/types/responseInterface';
import { Offer } from './entities/offer.entity';

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
        console.log(offer)
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
 @Post(':offerId/reject')
 @UseGuards(JwtAuthenticationGuard)
  async rejectOffer(
    @Param('offerId') offerId: number,
    @GetUser() user:User
  ) {
    try {
      const response = await this.offerService.rejectOffer({
        offerId ,
        sellerId: user.id
      });
      return response;
    } catch (error) {
      // Handle any errors that may arise from the service
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      } else if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      }
      throw error; // Re-throw unhandled errors
    }
  }

}
