import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GqlAdminGuard } from '../common/guards/gql-admin.guard';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule],
  providers: [OrdersResolver, OrdersService, GqlAuthGuard, GqlAdminGuard],
})
export class OrdersModule {}
