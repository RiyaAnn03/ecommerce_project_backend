import { Field, ID, InputType } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

@InputType()
export class UserWhereInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  id?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  mobile?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  email?: string;

  @Field(() => Role, { nullable: true })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
