import { Field, Float, ObjectType } from '@nestjs/graphql';
import { ContactModel } from './contact.model';

@ObjectType()
export class ContactListModel {
  @Field(() => [ContactModel])
  contacts!: ContactModel[];

  @Field(() => Float)
  contactsCount!: number;

  @Field(() => Float)
  newContactsCount!: number;
}
