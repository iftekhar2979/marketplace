import { Body, Controller, Headers, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { StripeService } from './stripe.service';
// import { ConfigService } from 'aws-sdk';
import { JwtAuthenticationGuard } from 'src/auth/guards/session-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { RechargeDto } from './dto/recharge.dto';
// import { WalletsModule } from 'src/wallets/wallets.module';
import { WalletsService } from 'src/wallets/wallets.service';

@Controller('stripe')
export class StripeController {
      constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    // private readonly walletService: WalletsService
  ) {}

  //   @Post('payment')
  // @UseGuards(JwtAuthenticationGuard)
  // async createPaymentIntent(
  //   @GetUser() user : User,
  //   @Body() body:RechargeDto
  // ) {
  //   const {  amount } = body;
  //   const paymentIntent = await this.stripeService.createPaymentIntent(
  //     amount,
  //     user,
  //   );
  //   return { paymentIntent };
  // }

  // Webhook handler for Stripe events
  @Post('checkout')
  async handleStripeWebhook(
    @Body() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    const endpointSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
// console.log(endpointSecret)
    try {
      // Use stripe.webhooks.constructEvent directly to verify the event
      const event = Stripe.webhooks.constructEvent(
        rawBody, // Raw body from the request
        signature,
        endpointSecret,
      );
      // Handle the event based on the event type
      // console.log(event.data.object)
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as any;
console.log(session) 
          const { user, amount, email, name } = session.metadata;

          // console.log(session.metadata)
        //   await this.walletService.rechargeWallet({userId:user.id, amount,paymentMethod:"Stripe"})
          // Perform necessary actions after successful payment
          break;

        case 'checkout.session.async_payment_failed':
          const invoice = event.data.object;
          throw new HttpException(
            'Webhook event verification failed',
            HttpStatus.BAD_REQUEST,
          );
          // Handle failed payment
          break;

        // Handle other event types here...

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (err) {
      console.error('Error processing webhook:', err);
      throw new HttpException(
        'Webhook event verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
