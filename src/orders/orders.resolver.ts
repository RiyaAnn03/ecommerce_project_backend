import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { OrderStatus } from '@prisma/client';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { GqlAdminGuard } from '../common/guards/gql-admin.guard';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { PlaceOrderInput } from './dto/place-order.input';
import { UpdateOrderStatusInput } from './dto/update-order-status.input';
import './enums/order.enums';
import { OrderListModel, OrderModel } from './models/order.model';
import { OrdersService } from './orders.service';

@Resolver(() => OrderModel)
export class OrdersResolver {
  constructor(private readonly orders: OrdersService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => OrderModel)
  placeOrder(
    @CurrentUserId() userId: string,
    @Args('input') input: PlaceOrderInput,
  ): Promise<OrderModel> {
    return this.orders.placeOrder(userId, input);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => OrderListModel)
  myOrders(
    @CurrentUserId() userId: string,
    @Args('skip', { type: () => Int, nullable: true, defaultValue: 0 }) skip?: number,
    @Args('take', { type: () => Int, nullable: true, defaultValue: 10 }) take?: number,
  ): Promise<OrderListModel> {
    return this.orders.myOrders(userId, skip, take);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => OrderModel)
  order(
    @CurrentUserId() userId: string,
    @Args('id') id: string,
  ): Promise<OrderModel> {
    return this.orders.findById(userId, id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => OrderModel)
  orderByNumber(
    @CurrentUserId() userId: string,
    @Args('orderNumber') orderNumber: string,
  ): Promise<OrderModel> {
    return this.orders.findByOrderNumber(userId, orderNumber);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => OrderModel)
  cancelOrder(
    @CurrentUserId() userId: string,
    @Args('id') id: string,
  ): Promise<OrderModel> {
    return this.orders.cancelOrder(userId, id);
  }

  @UseGuards(GqlAdminGuard)
  @Query(() => OrderListModel)
  adminOrders(
    @Args('skip', { type: () => Int, nullable: true, defaultValue: 0 }) skip?: number,
    @Args('take', { type: () => Int, nullable: true, defaultValue: 10 }) take?: number,
    @Args('status', { type: () => OrderStatus, nullable: true }) status?: OrderStatus,
  ): Promise<OrderListModel> {
    return this.orders.adminOrders(skip, take, status);
  }

  @UseGuards(GqlAdminGuard)
  @Mutation(() => OrderModel)
  updateOrderStatus(
    @Args('id') id: string,
    @Args('input') input: UpdateOrderStatusInput,
  ): Promise<OrderModel> {
    return this.orders.updateStatus(id, input);
  }
}
