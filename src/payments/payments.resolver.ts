import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { VerifyRazorpayPaymentInput } from './dto/verify-razorpay-payment.input';
import { OrderModel } from '../orders/models/order.model';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from './payments.service';

@Resolver()
export class PaymentsResolver {
  constructor(
    private readonly payments: PaymentsService,
    private readonly orders: OrdersService,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => OrderModel)
  async verifyRazorpayPayment(
    @CurrentUserId() userId: string,
    @Args('input') input: VerifyRazorpayPaymentInput,
  ): Promise<OrderModel> {
    await this.payments.verifyAndCompletePayment(
      userId,
      input.orderId,
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature,
    );

    return this.orders.findById(userId, input.orderId);
  }
}
