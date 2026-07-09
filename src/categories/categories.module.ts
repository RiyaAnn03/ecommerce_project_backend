import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GqlAdminGuard } from '../common/guards/gql-admin.guard';
import { CategoriesResolver } from './categories.resolver';
import { CategoriesService } from './categories.service';

@Module({
  imports: [AuthModule],
  providers: [CategoriesResolver, CategoriesService, GqlAdminGuard],
})
export class CategoriesModule {}
