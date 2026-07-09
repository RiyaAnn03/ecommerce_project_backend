import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressInput } from './dto/create-address.input';
import { UpdateAddressInput } from './dto/update-address.input';
import { AddressModel } from './models/address.model';

@Resolver(() => AddressModel)
export class AddressesResolver {
  constructor(private readonly addresses: AddressesService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => [AddressModel])
  myAddresses(@CurrentUserId() userId: string): Promise<AddressModel[]> {
    return this.addresses.findAll(userId);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => AddressModel)
  address(
    @CurrentUserId() userId: string,
    @Args('id') id: string,
  ): Promise<AddressModel> {
    return this.addresses.findById(userId, id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => AddressModel)
  createAddress(
    @CurrentUserId() userId: string,
    @Args('input') input: CreateAddressInput,
  ): Promise<AddressModel> {
    return this.addresses.create(userId, input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => AddressModel)
  updateAddress(
    @CurrentUserId() userId: string,
    @Args('id') id: string,
    @Args('input') input: UpdateAddressInput,
  ): Promise<AddressModel> {
    return this.addresses.update(userId, id, input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  deleteAddress(
    @CurrentUserId() userId: string,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.addresses.delete(userId, id);
  }
}
