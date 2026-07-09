import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AddressModel {
  @Field(() => ID)
  id!: string;

  @Field()
  fullName!: string;

  @Field()
  phone!: string;

  @Field()
  line1!: string;

  @Field(() => String, { nullable: true })
  line2?: string | null;

  @Field()
  city!: string;

  @Field()
  state!: string;

  @Field()
  postalCode!: string;

  @Field()
  country!: string;

  @Field()
  isDefault!: boolean;

  @Field()
  createdAt!: Date;
}
