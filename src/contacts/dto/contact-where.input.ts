import { Field, InputType } from '@nestjs/graphql';
import { ContactStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

@InputType()
export class ContactWhereInput {
  @Field(() => ContactStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;
}
