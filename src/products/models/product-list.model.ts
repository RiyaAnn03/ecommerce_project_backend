import { Field, Float, ObjectType } from '@nestjs/graphql';
import { ProductModel } from './product.model';

@ObjectType()
export class ProductListModel {
  @Field(() => [ProductModel])
  products!: ProductModel[];

  @Field(() => Float)
  productsCount!: number;

  @Field(() => Float)
  deletedProductsCount!: number;
}
