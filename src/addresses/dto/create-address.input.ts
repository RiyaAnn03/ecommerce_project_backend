import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

@InputType()
export class CreateAddressInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  fullName!: string;

  @Field()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'phone must be a 10 digit number' })
  phone!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  line1!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  line2?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  city!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  state!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Length(4, 10)
  postalCode!: string;

  @Field({ nullable: true, defaultValue: 'India' })
  @IsOptional()
  @IsString()
  country?: string;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
