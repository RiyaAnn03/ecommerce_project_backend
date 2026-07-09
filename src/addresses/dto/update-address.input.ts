import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

@InputType()
export class UpdateAddressInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'phone must be a 10 digit number' })
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3)
  line1?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  line2?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  state?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(4, 10)
  postalCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
