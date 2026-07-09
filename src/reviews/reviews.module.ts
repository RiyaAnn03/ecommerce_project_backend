import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { ReviewsResolver } from './reviews.resolver';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [AuthModule],
  providers: [ReviewsResolver, ReviewsService, GqlAuthGuard],
})
export class ReviewsModule {}
