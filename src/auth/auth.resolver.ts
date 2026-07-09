import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { getAuthHeader } from '../common/types/gql-context';
import type { GqlContext } from '../common/types/gql-context';
import { AuthService } from './auth.service';
import { CreateUserInput } from './dto/signup.input';
import { AuthPayloadModel } from './models/auth-payload.model';
import { UserModel } from './models/user.model';

@Resolver()
export class AuthResolver {
  constructor(private readonly auth: AuthService) {}

  @Mutation(() => AuthPayloadModel)
  async createUser(@Args('input') input: CreateUserInput): Promise<AuthPayloadModel> {
    const { accessToken, refreshToken, user } = await this.auth.createUser(input);
    return { accessToken, refreshToken, userId: user.id, user };
  }

  @Mutation(() => AuthPayloadModel)
  async login(
    @Args('mobile') mobile: string,
    @Args('password') password: string,
  ): Promise<AuthPayloadModel> {
    const { accessToken, refreshToken, user } = await this.auth.login({ mobile, password });
    return { accessToken, refreshToken, userId: user.id, user };
  }

  @Mutation(() => AuthPayloadModel)
  async refreshToken(@Args('refreshToken') refreshToken: string): Promise<AuthPayloadModel> {
    const { accessToken, refreshToken: newRefreshToken, user } =
      await this.auth.refreshAccessToken(refreshToken);
    return { accessToken, refreshToken: newRefreshToken, userId: user.id, user };
  }

  @Query(() => UserModel, { nullable: true })
  async me(@Context() ctx: GqlContext): Promise<UserModel | null> {
    const userId = this.auth.getUserIdFromAuthHeader(getAuthHeader(ctx));
    if (!userId) return null;
    return this.auth.getPublicUser(userId);
  }
}
