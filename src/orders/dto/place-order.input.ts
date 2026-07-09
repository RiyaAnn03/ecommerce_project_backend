import { Field, InputType } from '@nestjs/graphql';
import { DeliveryMethod, PaymentMethod } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class PlaceOrderInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  addressId!: string;

  @Field(() => DeliveryMethod)
  @IsEnum(DeliveryMethod)
  deliveryMethod!: DeliveryMethod;

  @Field(() => PaymentMethod)
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}
