import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;
}
