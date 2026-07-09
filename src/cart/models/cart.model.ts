import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { ProductModel } from '../../products/models/product.model';

@ObjectType()
export class CartItemModel {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  quantity!: number;

  @Field(() => ID)
  productId!: string;

  @Field(() => ProductModel)
  product!: ProductModel;

  @Field(() => Float)
  lineTotal!: number;
}

@ObjectType()
export class CartModel {
  @Field(() => ID)
  id!: string;

  @Field(() => [CartItemModel])
  items!: CartItemModel[];

  @Field(() => Int)
  itemCount!: number;

  @Field(() => Float)
  subtotal!: number;
}
