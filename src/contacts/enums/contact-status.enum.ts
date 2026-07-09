import { registerEnumType } from '@nestjs/graphql';
import { ContactStatus } from '@prisma/client';

registerEnumType(ContactStatus, { name: 'ContactStatus' });

export { ContactStatus };
