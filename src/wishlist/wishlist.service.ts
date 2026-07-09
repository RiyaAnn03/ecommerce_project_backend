import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';
type WishlistWithProduct = Prisma.WishlistItemGetPayload<{
  include: { product: { include: { category: true } } };
}>;

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  private toItem(item: WishlistWithProduct) {
    return {
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt,
      product: {
        ...item.product,
        price: Number(item.product.price),
        compareAtPrice: item.product.compareAtPrice
          ? Number(item.product.compareAtPrice)
          : null,
      },
    };
  }

  async getWishlist(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => this.toItem(item));
  }

  async addItem(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppException(404, ErrorCode.NOT_FOUND, 'Product not found');

    await this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });

    return this.getWishlist(userId);
  }

  async removeItem(userId: string, productId: string) {
    const item = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!item) throw new AppException(404, ErrorCode.NOT_FOUND, 'Item not in wishlist');

    await this.prisma.wishlistItem.delete({
      where: { userId_productId: { userId, productId } },
    });

    return this.getWishlist(userId);
  }

  async isInWishlist(userId: string, productId: string) {
    const item = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return !!item;
  }
}
