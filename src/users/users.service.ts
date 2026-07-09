import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { SortOrder } from '../common/enums/sort-order.enum';
import { resolvePagination } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordInput } from './dto/change-password.input';
import { UpdateProfileInput } from './dto/update-profile.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserOrderByInput, UserSortField } from './dto/user-order-by.input';
import { UserWhereInput } from './dto/user-where.input';

export type UserListArgs = {
  where?: UserWhereInput;
  search?: string;
  skip?: number;
  take?: number;
  orderBy?: UserOrderByInput[];
};

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  mobile: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(args: UserListArgs, includeDeleted: boolean): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = includeDeleted
      ? { deletedAt: { not: null } }
      : { deletedAt: null };

    if (args.where?.id) where.id = args.where.id;
    if (args.where?.mobile) where.mobile = args.where.mobile;
    if (args.where?.email) where.email = args.where.email;
    if (args.where?.role) where.role = args.where.role;

    if (args.search?.trim()) {
      const q = args.search.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildOrderBy(
    orderBy?: UserOrderByInput[],
  ): Prisma.UserOrderByWithRelationInput[] {
    if (!orderBy?.length) {
      return [{ createdAt: 'desc' }];
    }

    return orderBy.map((item) => {
      const direction = item.direction === SortOrder.ASC ? 'asc' : 'desc';
      switch (item.field) {
        case UserSortField.FIRST_NAME:
          return { firstName: direction };
        case UserSortField.LAST_NAME:
          return { lastName: direction };
        case UserSortField.MOBILE:
          return { mobile: direction };
        case UserSortField.EMAIL:
          return { email: direction };
        case UserSortField.ROLE:
          return { role: direction };
        default:
          return { createdAt: direction };
      }
    });
  }

  async findMany(args: UserListArgs = {}) {
    const { skip, take } = resolvePagination({
      skip: args.skip,
      take: args.take ?? 10,
    });

    const activeWhere = this.buildWhere(args, false);
    const deletedWhere = this.buildWhere(args, true);

    const [users, usersCount, deletedUserCount] = await Promise.all([
      this.prisma.user.findMany({
        where: activeWhere,
        skip,
        take,
        orderBy: this.buildOrderBy(args.orderBy),
        select: publicUserSelect,
      }),
      this.prisma.user.count({ where: activeWhere }),
      this.prisma.user.count({ where: deletedWhere }),
    ]);

    return {
      users,
      usersCount,
      deletedUserCount,
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: publicUserSelect,
    });
    if (!user) throw new AppException(404, ErrorCode.NOT_FOUND, 'User not found');
    return user;
  }

  async findDetailById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...publicUserSelect,
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
        _count: {
          select: {
            orders: true,
            wishlistItems: true,
          },
        },
        cart: {
          select: {
            _count: { select: { items: true } },
          },
        },
      },
    });
    if (!user) throw new AppException(404, ErrorCode.NOT_FOUND, 'User not found');

    const { _count, cart, addresses, ...profile } = user;
    return {
      ...profile,
      addresses,
      ordersCount: _count.orders,
      wishlistItemCount: _count.wishlistItems,
      cartItemCount: cart?._count.items ?? 0,
    };
  }

  private async assertUniqueContact(
    id: string,
    mobile?: string,
    email?: string | null,
  ) {
    if (!mobile && email === undefined) return;

    const or: Prisma.UserWhereInput[] = [];
    if (mobile) or.push({ mobile });
    if (email) or.push({ email });

    if (!or.length) return;

    const existing = await this.prisma.user.findFirst({
      where: { OR: or, NOT: { id } },
    });
    if (existing) {
      throw new AppException(409, ErrorCode.CONFLICT, 'Mobile or email already in use');
    }
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    await this.findById(userId);

    const email = input.email !== undefined ? input.email.trim() || null : undefined;
    await this.assertUniqueContact(userId, undefined, email);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.firstName != null && { firstName: input.firstName.trim() }),
        ...(input.lastName != null && { lastName: input.lastName.trim() }),
        ...(email !== undefined && { email }),
      },
      select: publicUserSelect,
    });
  }

  async updateUser(id: string, input: UpdateUserInput, actorId: string) {
    await this.findById(id);

    if (input.role != null && id === actorId) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'Cannot change your own role');
    }

    const mobile = input.mobile?.trim();
    const email = input.email !== undefined ? input.email.trim() || null : undefined;
    await this.assertUniqueContact(id, mobile, email);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(input.firstName != null && { firstName: input.firstName.trim() }),
        ...(input.lastName != null && { lastName: input.lastName.trim() }),
        ...(mobile != null && { mobile }),
        ...(email !== undefined && { email }),
        ...(input.role != null && { role: input.role }),
      },
      select: publicUserSelect,
    });
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { passwordHash: true },
    });
    if (!user) throw new AppException(404, ErrorCode.NOT_FOUND, 'User not found');

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, refreshTokenHash: null },
    });
    return true;
  }

  async adminCreateUser(input: {
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
    password: string;
    role: Role;
  }) {
    const mobile = input.mobile.trim();
    const email = input.email?.trim() || null;

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ mobile }, ...(email ? [{ email }] : [])] },
    });
    if (existing) {
      throw new AppException(409, ErrorCode.CONFLICT, 'User already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.prisma.user.create({
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        mobile,
        email,
        passwordHash,
        role: input.role,
      },
      select: publicUserSelect,
    });
  }

  async updateRole(id: string, role: Role, actorId: string) {
    if (id === actorId) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'Cannot change your own role');
    }
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: publicUserSelect,
    });
  }

  async deleteUser(id: string, actorId: string) {
    if (id === actorId) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'Cannot delete your own account');
    }
    await this.findById(id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), refreshTokenHash: null },
    });
    return true;
  }
}
