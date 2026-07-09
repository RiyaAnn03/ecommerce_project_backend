import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../errors/app.exception';
import { ErrorCode } from '../errors/error-codes';
import { getAuthHeader } from '../types/gql-context';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class GqlAdminGuard implements CanActivate {
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
    if (!user || user.role !== Role.ADMIN) {
      throw new AppException(403, ErrorCode.FORBIDDEN, 'Admin access required');
    }

    gqlCtx.userId = userId;
    return true;
  }
}
