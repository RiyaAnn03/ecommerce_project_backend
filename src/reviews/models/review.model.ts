import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ReviewModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  productId!: string;

  @Field(() => ID)
  orderId!: string;

  @Field(() => Int)
  rating!: number;

  @Field(() => String, { nullable: true })
  comment?: string | null;

  @Field()
  userName!: string;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class ProductReviewsModel {
  @Field(() => [ReviewModel])
  reviews!: ReviewModel[];

  @Field(() => Float)
  reviewsCount!: number;

  @Field(() => Float)
  averageRating!: number;
}
