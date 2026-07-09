import { Field, Float, ObjectType } from '@nestjs/graphql';
import { CategoryModel } from './category.model';

@ObjectType()
export class CategoryListModel {
  @Field(() => [CategoryModel])
  categories!: CategoryModel[];

  @Field(() => Float)
  categoriesCount!: number;

  @Field(() => Float)
  deletedCategoriesCount!: number;
}
