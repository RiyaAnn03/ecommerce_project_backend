import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { AddressModel } from '../../addresses/models/address.model';

@ObjectType()
export class OrderItemModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  productId!: string;

  @Field()
  productName!: string;

  @Field()
  productSlug!: string;

  @Field(() => String, { nullable: true })
  imageUrl?: string | null;

  @Field(() => Float)
  unitPrice!: number;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Float)
  lineTotal!: number;
}

@ObjectType()
export class OrderStatusHistoryModel {
  @Field(() => ID)
  id!: string;

  @Field(() => OrderStatus)
  status!: OrderStatus;

  @Field(() => String, { nullable: true })
  note?: string | null;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class OrderModel {
  @Field(() => ID)
  id!: string;

  @Field()
  orderNumber!: string;

  @Field(() => OrderStatus)
  status!: OrderStatus;

  @Field(() => DeliveryMethod)
  deliveryMethod!: DeliveryMethod;

  @Field(() => PaymentMethod)
  paymentMethod!: PaymentMethod;

  @Field(() => PaymentStatus)
  paymentStatus!: PaymentStatus;

  @Field(() => Float)
  subtotal!: number;

  @Field(() => Float)
  deliveryFee!: number;

  @Field(() => Float)
  total!: number;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => AddressModel)
  address!: AddressModel;

  @Field(() => [OrderItemModel])
  items!: OrderItemModel[];

  @Field(() => [OrderStatusHistoryModel])
  statusHistory!: OrderStatusHistoryModel[];

  @Field()
  placedAt!: Date;

  @Field(() => Date, { nullable: true })
  deliveredAt?: Date | null;

  @Field(() => Date, { nullable: true })
  cancelledAt?: Date | null;
}

@ObjectType()
export class OrderListModel {
  @Field(() => [OrderModel])
  orders!: OrderModel[];

  @Field(() => Float)
  ordersCount!: number;
}
