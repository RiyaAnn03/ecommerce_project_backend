import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CreateReviewInput } from './dto/create-review.input';
import { ProductReviewsModel, ReviewModel } from './models/review.model';
import { ReviewsService } from './reviews.service';

@Resolver(() => ReviewModel)
export class ReviewsResolver {
  constructor(private readonly reviews: ReviewsService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => ReviewModel)
  createReview(
    @CurrentUserId() userId: string,
    @Args('input') input: CreateReviewInput,
  ): Promise<ReviewModel> {
    return this.reviews.create(userId, input);
  }

  @Query(() => ProductReviewsModel)
  productReviews(
    @Args('productId') productId: string,
    @Args('skip', { type: () => Int, nullable: true, defaultValue: 0 }) skip?: number,
    @Args('take', { type: () => Int, nullable: true, defaultValue: 10 }) take?: number,
  ): Promise<ProductReviewsModel> {
    return this.reviews.productReviews(productId, skip, take);
  }
}
