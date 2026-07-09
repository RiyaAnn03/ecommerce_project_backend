import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CartService } from './cart.service';
import { CartModel } from './models/cart.model';

@Resolver(() => CartModel)
export class CartResolver {
  constructor(private readonly cart: CartService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => CartModel)
  myCart(@CurrentUserId() userId: string): Promise<CartModel> {
    return this.cart.getCart(userId);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => CartModel)
  addToCart(
    @CurrentUserId() userId: string,
    @Args('productId') productId: string,
    @Args('quantity', { type: () => Int, nullable: true, defaultValue: 1 }) quantity: number,
  ): Promise<CartModel> {
    return this.cart.addItem(userId, productId, quantity);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => CartModel)
  updateCartItem(
    @CurrentUserId() userId: string,
    @Args('productId') productId: string,
    @Args('quantity', { type: () => Int }) quantity: number,
  ): Promise<CartModel> {
    return this.cart.updateItemQuantity(userId, productId, quantity);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => CartModel)
  removeFromCart(
    @CurrentUserId() userId: string,
    @Args('productId') productId: string,
  ): Promise<CartModel> {
    return this.cart.removeItem(userId, productId);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => CartModel)
  clearCart(@CurrentUserId() userId: string): Promise<CartModel> {
    return this.cart.clearCart(userId);
  }
}
