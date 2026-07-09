import { Field, ObjectType } from '@nestjs/graphql';
import { SkillLevel } from '@prisma/client';

@ObjectType()
export class ProductFilterOptionsModel {
  @Field(() => [String])
  yarnTypes!: string[];

  @Field(() => [String])
  tags!: string[];

  @Field(() => [SkillLevel])
  skillLevels!: SkillLevel[];
}
