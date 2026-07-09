import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { AddressesResolver } from './addresses.resolver';
import { AddressesService } from './addresses.service';

@Module({
  imports: [AuthModule],
  providers: [AddressesResolver, AddressesService, GqlAuthGuard],
  exports: [AddressesService],
})
export class AddressesModule {}
