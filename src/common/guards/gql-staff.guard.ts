import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { AuthService } from '../../auth/auth.service';
import { AppException } from '../errors/app.exception';
import { ErrorCode } from '../errors/error-codes';
import { getAuthHeader } from '../types/gql-context';
import { PrismaService } from '../../prisma/prisma.service';

const STAFF_ROLES: Role[] = [Role.ADMIN, Role.STAFF];

@Injectable()
export class GqlStaffGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context).getContext();
    const userId = this.auth.getUserIdFromAuthHeader(getAuthHeader(gqlCtx));
    if (!userId) {
      throw new AppException(401, ErrorCode.UNAUTHENTICATED, 'Authentication required');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt || !STAFF_ROLES.includes(user.role)) {
      throw new AppException(403, ErrorCode.FORBIDDEN, 'Staff access required');
    }

    gqlCtx.userId = userId;
    return true;
  }
}
