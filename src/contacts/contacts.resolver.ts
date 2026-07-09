import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ContactStatus } from '@prisma/client';
import { GqlStaffGuard } from '../common/guards/gql-staff.guard';
import { ContactsService } from './contacts.service';
import { ContactWhereInput } from './dto/contact-where.input';
import { SubmitContactInput } from './dto/submit-contact.input';
import './enums/contact-status.enum';
import { ContactListModel } from './models/contact-list.model';
import { ContactModel } from './models/contact.model';

@Resolver(() => ContactModel)
export class ContactsResolver {
  constructor(private readonly contacts: ContactsService) {}

  @Mutation(() => ContactModel)
  submitContact(@Args('input') input: SubmitContactInput): Promise<ContactModel> {
    return this.contacts.submit(input);
  }

  @UseGuards(GqlStaffGuard)
  @Query(() => ContactListModel, { name: 'contacts' })
  getContacts(
    @Args('where', { nullable: true }) where?: ContactWhereInput,
    @Args('search', { nullable: true }) search?: string,
    @Args('skip', { type: () => Int, nullable: true, defaultValue: 0 }) skip?: number,
    @Args('take', { type: () => Int, nullable: true, defaultValue: 10 }) take?: number,
  ): Promise<ContactListModel> {
    return this.contacts.findMany({ where, search, skip, take });
  }

  @UseGuards(GqlStaffGuard)
  @Query(() => ContactModel)
  contact(@Args('id') id: string): Promise<ContactModel> {
    return this.contacts.findById(id);
  }

  @UseGuards(GqlStaffGuard)
  @Mutation(() => ContactModel)
  updateContactStatus(
    @Args('id') id: string,
    @Args('status', { type: () => ContactStatus }) status: ContactStatus,
  ): Promise<ContactModel> {
    return this.contacts.updateStatus(id, status);
  }
}
