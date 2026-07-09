import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { WishlistItemModel } from './models/wishlist-item.model';
import { WishlistService } from './wishlist.service';

@Resolver(() => WishlistItemModel)
export class WishlistResolver {
  constructor(private readonly wishlist: WishlistService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => [WishlistItemModel])
  myWishlist(@CurrentUserId() userId: string): Promise<WishlistItemModel[]> {
    return this.wishlist.getWishlist(userId);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => Boolean)
  isInWishlist(
    @CurrentUserId() userId: string,
    @Args('productId') productId: string,
  ): Promise<boolean> {
    return this.wishlist.isInWishlist(userId, productId);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => [WishlistItemModel])
  addToWishlist(
    @CurrentUserId() userId: string,
    @Args('productId') productId: string,
  ): Promise<WishlistItemModel[]> {
    return this.wishlist.addItem(userId, productId);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => [WishlistItemModel])
  removeFromWishlist(
    @CurrentUserId() userId: string,
    @Args('productId') productId: string,
  ): Promise<WishlistItemModel[]> {
    return this.wishlist.removeItem(userId, productId);
  }
}
