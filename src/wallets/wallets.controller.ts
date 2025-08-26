import { BadRequestException, Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtAuthenticationGuard } from 'src/auth/guards/session-auth.guard';
import { User } from 'src/user/entities/user.entity';
import { Wallets } from './entity/wallets.entity';
import { ResponseInterface } from 'src/common/types/responseInterface';
import { WalletsService } from './wallets.service';
import { RechargeDto } from 'src/stripe/dto/recharge.dto';

@Controller('wallets')
export class WalletsController {
    constructor(
        private readonly walletsService: WalletsService
    ) {}

    @Get("balance")
    @UseGuards(JwtAuthenticationGuard)
    async getWalletDetails(@GetUser() user:User): Promise<ResponseInterface<Wallets>> {
        return this.walletsService.getWalletByUserId(user.id);
    }

    @Post('recharge')
     @UseGuards(JwtAuthenticationGuard)
  async rechargeWallet(
    @GetUser() user: User,
    @Body() rechargeDto: RechargeDto
  ): Promise<any> {
    try {
      return {status:"success", statusCode:201,data: await this.walletsService.rechargeWallet({userId:user.id, amount: rechargeDto.amount , paymentMethod:rechargeDto.paymentMethod, transectionId:rechargeDto.transectionId})}
    } catch (error) {
      throw new BadRequestException(error.response || error.message);
    }
  }

}
