import { Field, InputType } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

@InputType()
export class UpdateUserInput {
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
  @IsString()
  @Matches(/^\d{10}$/, { message: 'mobile must be a 10 digit number' })
  mobile?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field(() => Role, { nullable: true })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
