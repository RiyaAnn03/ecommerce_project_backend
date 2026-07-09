import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { AuthService } from '../../auth/auth.service';
import { AppException } from '../errors/app.exception';
import { ErrorCode } from '../errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const userId = this.auth.getUserIdFromAuthHeader(authHeader);
    if (!userId) {
      throw new AppException(401, ErrorCode.UNAUTHENTICATED, 'Authentication required');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.ADMIN) {
      throw new AppException(403, ErrorCode.FORBIDDEN, 'Admin access required');
    }

    (request as Request & { userId?: string }).userId = userId;
    return true;
  }
}
