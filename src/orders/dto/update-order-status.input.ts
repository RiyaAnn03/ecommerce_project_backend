import { Field, InputType } from '@nestjs/graphql';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateOrderStatusInput {
  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @Field(() => PaymentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  note?: string;
}
