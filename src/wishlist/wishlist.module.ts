import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { WishlistResolver } from './wishlist.resolver';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [AuthModule],
  providers: [WishlistResolver, WishlistService, GqlAuthGuard],
})
export class WishlistModule {}
