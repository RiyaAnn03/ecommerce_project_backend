import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GqlStaffGuard } from '../common/guards/gql-staff.guard';
import { ContactsResolver } from './contacts.resolver';
import { ContactsService } from './contacts.service';

@Module({
  imports: [AuthModule],
  providers: [ContactsResolver, ContactsService, GqlStaffGuard],
})
export class ContactsModule {}
