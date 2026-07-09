import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

@InputType()
export class SubmitContactInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'mobile must be a 10 digit number' })
  mobile!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;
}
