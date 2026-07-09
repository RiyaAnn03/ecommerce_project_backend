import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CartResolver } from './cart.resolver';
import { CartService } from './cart.service';

@Module({
  imports: [AuthModule],
  providers: [CartResolver, CartService, GqlAuthGuard],
})
export class CartModule {}
