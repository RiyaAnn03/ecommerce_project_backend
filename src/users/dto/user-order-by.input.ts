import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { SortOrder } from '../../common/enums/sort-order.enum';

export enum UserSortField {
  FIRST_NAME = 'FIRST_NAME',
  LAST_NAME = 'LAST_NAME',
  MOBILE = 'MOBILE',
  EMAIL = 'EMAIL',
  CREATED_AT = 'CREATED_AT',
  ROLE = 'ROLE',
}

registerEnumType(UserSortField, { name: 'UserSortField' });

@InputType()
export class UserOrderByInput {
  @Field(() => UserSortField, { nullable: true, defaultValue: UserSortField.CREATED_AT })
  @IsOptional()
  @IsEnum(UserSortField)
  field?: UserSortField;

  @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  direction?: SortOrder;
}
