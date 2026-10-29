import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

@InputType()
export class ChatMessageInput {
  @Field()
  @IsIn(['user', 'model'])
  role!: 'user' | 'model';

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}

@InputType()
export class ChatInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  message!: string;

  @Field(() => [ChatMessageInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageInput)
  history?: ChatMessageInput[];
}
