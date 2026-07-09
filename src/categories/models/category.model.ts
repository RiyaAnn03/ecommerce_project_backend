import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CategoryModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  imageUrl?: string | null;

  @Field()
  createdAt!: Date;
}
