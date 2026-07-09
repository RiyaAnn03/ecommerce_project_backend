import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GqlAdminGuard } from '../common/guards/gql-admin.guard';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import './enums/role.enum';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule],
  providers: [UsersResolver, UsersService, GqlAdminGuard, GqlAuthGuard],
})
export class UsersModule {}
