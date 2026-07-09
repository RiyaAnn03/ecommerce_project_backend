import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { SkillLevel } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateProductInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  slug?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price!: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @Field(() => Int, { defaultValue: 0 })
  @IsInt()
  @Min(0)
  stock!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  yarnType?: string;

  @Field(() => SkillLevel, { nullable: true })
  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevel?: SkillLevel;

  @Field({ defaultValue: false })
  @IsBoolean()
  patternIncluded!: boolean;

  @Field(() => [String], { defaultValue: [] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @Field()
  @IsString()
  @IsNotEmpty()
  categoryId!: string;
}
