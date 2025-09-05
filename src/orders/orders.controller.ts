import { Controller, Get, OnModuleInit, Param, Post, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtAuthenticationGuard } from 'src/auth/guards/session-auth.guard';

@Controller('orders')
export class OrdersController  {
constructor(private readonly ordersService: OrdersService) {}

  @Get('phurcases')
  @UseGuards(JwtAuthenticationGuard)
  getOrdersByBuyer(@GetUser() user:User, @Query('page') page = 1,
    @Query('limit') limit = 10,) {
    return this.ordersService.findByBuyerId(user.id,page,limit)
  }
  @Get('sales')
  @UseGuards(JwtAuthenticationGuard)
  getOrdersBySeller(@GetUser() user:User , @Query('page') page = 1,
    @Query('limit') limit = 10) {
    return this.ordersService.findBySellerId(user.id,page , limit)
  }


  @Post(':id/purchases')
  @UseGuards(JwtAuthenticationGuard)
  phurcase(@GetUser() user:User, @Query('page') page = 1,
    @Query('limit') limit = 10,) {
    return this.ordersService.findByBuyerId(user.id,page,limit)
  }


}
