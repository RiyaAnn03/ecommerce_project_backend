import { Field, Float, ObjectType } from '@nestjs/graphql';
import { OrderModel } from '../../orders/models/order.model';

@ObjectType()
export class RazorpayCheckoutModel {
  @Field()
  keyId!: string;

  @Field()
  razorpayOrderId!: string;

  @Field(() => Float)
  amount!: number;

  @Field()
  currency!: string;
}

@ObjectType()
export class PlaceOrderResultModel {
  @Field(() => OrderModel)
  order!: OrderModel;

  @Field(() => RazorpayCheckoutModel, { nullable: true })
  razorpay?: RazorpayCheckoutModel | null;
}
