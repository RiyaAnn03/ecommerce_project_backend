import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  firstName!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  lastName!: string;

  @Field()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'mobile must be a 10 digit number' })
  mobile!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field()
  @IsString()
  @MinLength(6)
  password!: string;
}

