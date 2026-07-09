import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { SkillLevel } from '@prisma/client';
import { CategoryModel } from '../../categories/models/category.model';

@ObjectType()
export class ProductModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field()
  description!: string;

  @Field(() => Float)
  price!: number;

  @Field(() => Float, { nullable: true })
  compareAtPrice?: number | null;

  @Field(() => [String])
  images!: string[];

  @Field(() => Int)
  stock!: number;

  @Field(() => String, { nullable: true })
  yarnType?: string | null;

  @Field(() => SkillLevel, { nullable: true })
  skillLevel?: SkillLevel | null;

  @Field()
  patternIncluded!: boolean;

  @Field(() => [String])
  tags!: string[];

  @Field(() => ID)
  categoryId!: string;

  @Field(() => CategoryModel, { nullable: true })
  category?: CategoryModel;

  @Field()
  createdAt!: Date;
}
