import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { GqlAdminGuard } from '../common/guards/gql-admin.guard';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { AdminCreateUserInput } from './dto/admin-create-user.input';
import { ChangePasswordInput } from './dto/change-password.input';
import { UpdateProfileInput } from './dto/update-profile.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserOrderByInput } from './dto/user-order-by.input';
import { UserWhereInput } from './dto/user-where.input';
import { UserDetailModel } from './models/user-detail.model';
import { UserListModel } from './models/user-list.model';
import { UserModel } from './models/user.model';
import { UsersService } from './users.service';

@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly users: UsersService) {}

  @UseGuards(GqlAdminGuard)
  @Query(() => UserListModel, { name: 'users' })
  getUsers(
    @Args('where', { nullable: true }) where?: UserWhereInput,
    @Args('search', { nullable: true }) search?: string,
    @Args('skip', { type: () => Int, nullable: true, defaultValue: 0 }) skip?: number,
    @Args('take', { type: () => Int, nullable: true, defaultValue: 10 }) take?: number,
    @Args('orderBy', { type: () => [UserOrderByInput], nullable: true })
    orderBy?: UserOrderByInput[],
  ): Promise<UserListModel> {
    return this.users.findMany({ where, search, skip, take, orderBy });
  }

  @UseGuards(GqlAdminGuard)
  @Query(() => UserDetailModel)
  user(@Args('id') id: string): Promise<UserDetailModel> {
    return this.users.findDetailById(id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserDetailModel)
  myProfile(@CurrentUserId() userId: string): Promise<UserDetailModel> {
    return this.users.findDetailById(userId);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserModel)
  updateProfile(
    @CurrentUserId() userId: string,
    @Args('input') input: UpdateProfileInput,
  ): Promise<UserModel> {
    return this.users.updateProfile(userId, input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  changePassword(
    @CurrentUserId() userId: string,
    @Args('input') input: ChangePasswordInput,
  ): Promise<boolean> {
    return this.users.changePassword(userId, input);
  }

  @UseGuards(GqlAdminGuard)
  @Mutation(() => UserModel)
  updateUser(
    @CurrentUserId() actorId: string,
    @Args('id') id: string,
    @Args('input') input: UpdateUserInput,
  ): Promise<UserModel> {
    return this.users.updateUser(id, input, actorId);
  }

  @UseGuards(GqlAdminGuard)
  @Mutation(() => UserModel)
  adminCreateUser(@Args('input') input: AdminCreateUserInput): Promise<UserModel> {
    return this.users.adminCreateUser(input);
  }

  @UseGuards(GqlAdminGuard)
  @Mutation(() => UserModel)
  updateUserRole(
    @CurrentUserId() actorId: string,
    @Args('id') id: string,
    @Args('role', { type: () => Role }) role: Role,
  ): Promise<UserModel> {
    return this.users.updateRole(id, role, actorId);
  }

  @UseGuards(GqlAdminGuard)
  @Mutation(() => Boolean)
  deleteUser(
    @CurrentUserId() actorId: string,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.users.deleteUser(id, actorId);
  }
}
