import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GqlAdminGuard } from '../common/guards/gql-admin.guard';
import './enums/skill-level.enum';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './products.service';

@Module({
  imports: [AuthModule],
  providers: [ProductsResolver, ProductsService, GqlAdminGuard],
})
export class ProductsModule {}
