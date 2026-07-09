import { Field, Float, ID, InputType, registerEnumType } from '@nestjs/graphql';
import { SkillLevel } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { SortOrder } from '../../common/enums/sort-order.enum';

export enum ProductSortField {
  NAME = 'NAME',
  PRICE = 'PRICE',
  CREATED_AT = 'CREATED_AT',
}

registerEnumType(ProductSortField, { name: 'ProductSortField' });

@InputType()
export class ProductWhereInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  id?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @Field(() => SkillLevel, { nullable: true })
  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevel?: SkillLevel;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  yarnType?: string;

  @Field({ nullable: true })
  @IsOptional()
  patternIncluded?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  tags?: string[];
}

@InputType()
export class ProductOrderByInput {
  @Field(() => ProductSortField, { nullable: true, defaultValue: ProductSortField.CREATED_AT })
  @IsOptional()
  @IsEnum(ProductSortField)
  field?: ProductSortField;

  @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  direction?: SortOrder;
}
