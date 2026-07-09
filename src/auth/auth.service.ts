import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';

export type PublicUser = {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string | null;
  role: Role;
  createdAt: Date;
};

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  mobile: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  toPublicUser(user: {
    id: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email: string | null;
    role: Role;
    createdAt: Date;
  }): PublicUser {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppException(500, ErrorCode.INTERNAL_ERROR, 'JWT_SECRET is not set');
    }
    return secret;
  }

  private getAccessExpiresIn(): string {
    return process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  }

  private getRefreshExpiresIn(): string {
    return process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  }

  private signAccessToken(userId: string): string {
    return jwt.sign(
      { sub: userId, typ: 'access' },
      this.getJwtSecret(),
      { expiresIn: this.getAccessExpiresIn() } as jwt.SignOptions,
    );
  }

  private signRefreshToken(userId: string): string {
    return jwt.sign(
      { sub: userId, typ: 'refresh' },
      this.getJwtSecret(),
      { expiresIn: this.getRefreshExpiresIn() } as jwt.SignOptions,
    );
  }

  async createUser(input: {
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
    password: string;
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
    const user = await this.prisma.user.create({
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        mobile,
        email,
        passwordHash,
      },
      select: publicUserSelect,
    });

    const refreshToken = this.signRefreshToken(user.id);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    const accessToken = this.signAccessToken(user.id);
    return { accessToken, refreshToken, user: this.toPublicUser(user) };
  }

  async login(input: { mobile: string; password: string }) {
    const mobile = input.mobile.trim();
    const user = await this.prisma.user.findUnique({ where: { mobile } });
    if (!user || user.deletedAt) {
      throw new AppException(401, ErrorCode.UNAUTHENTICATED, 'Invalid mobile or password');
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new AppException(401, ErrorCode.UNAUTHENTICATED, 'Invalid mobile or password');
    }

    const refreshToken = this.signRefreshToken(user.id);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    const accessToken = this.signAccessToken(user.id);
    const publicUser = await this.getPublicUser(user.id);
    if (!publicUser) {
      throw new AppException(401, ErrorCode.UNAUTHENTICATED, 'Invalid mobile or password');
    }
    return { accessToken, refreshToken, user: publicUser };
  }

  async refreshAccessToken(refreshToken: string) {
    let payload: { sub?: string; typ?: string };
    try {
      payload = jwt.verify(refreshToken, this.getJwtSecret()) as { sub?: string; typ?: string };
    } catch {
      throw new AppException(401, ErrorCode.UNAUTHENTICATED, 'Invalid refresh token');
    }

    if (!payload.sub || payload.typ !== 'refresh') {
      throw new AppException(401, ErrorCode.UNAUTHENTICATED, 'Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.refreshTokenHash || user.deletedAt) {
      throw new AppException(401, ErrorCode.UNAUTHENTICATED, 'Invalid refresh token');
    }

    const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!ok) {
      throw new AppException(401, ErrorCode.UNAUTHENTICATED, 'Invalid refresh token');
    }

    const newRefreshToken = this.signRefreshToken(user.id);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newRefreshTokenHash },
    });

    const accessToken = this.signAccessToken(user.id);
    const publicUser = await this.getPublicUser(user.id);
    if (!publicUser) {
      throw new AppException(401, ErrorCode.UNAUTHENTICATED, 'Invalid refresh token');
    }
    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: publicUser,
    };
  }

  async getPublicUser(userId: string): Promise<PublicUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: publicUserSelect,
    });
    return user ? this.toPublicUser(user) : null;
  }

  getUserIdFromAuthHeader(authHeader?: string): string | null {
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice('Bearer '.length);
    try {
      const payload = jwt.verify(token, this.getJwtSecret()) as { sub?: string; typ?: string };
      if (payload.typ && payload.typ !== 'access') return null;
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }
}
