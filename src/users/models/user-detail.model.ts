import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AddressModel } from '../../addresses/models/address.model';
import { UserModel } from './user.model';

@ObjectType()
export class UserDetailModel extends UserModel {
  @Field(() => [AddressModel])
  addresses!: AddressModel[];

  @Field(() => Int)
  ordersCount!: number;

  @Field(() => Int)
  wishlistItemCount!: number;

  @Field(() => Int)
  cartItemCount!: number;

  @Field()
  updatedAt!: Date;
}
