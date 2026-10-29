import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GqlAdminGuard } from '../common/guards/gql-admin.guard';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { PaymentsModule } from '../payments/payments.module';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule, forwardRef(() => PaymentsModule)],
  providers: [OrdersResolver, OrdersService, GqlAuthGuard, GqlAdminGuard],
  exports: [OrdersService],
})
export class OrdersModule {}
