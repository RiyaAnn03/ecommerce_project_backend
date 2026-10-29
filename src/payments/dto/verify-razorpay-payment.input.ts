import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class VerifyRazorpayPaymentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  razorpayOrderId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  razorpaySignature!: string;
}
