import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ProductModel } from '../../products/models/product.model';

@ObjectType()
export class WishlistItemModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  productId!: string;

  @Field(() => ProductModel)
  product!: ProductModel;

  @Field()
  createdAt!: Date;
}
