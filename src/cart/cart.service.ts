import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';

type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: { product: { include: { category: true } } };
    };
  };
}>;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private toCartModel(cart: CartWithItems) {
    const items = cart.items.map((item: CartWithItems['items'][number]) => ({
      id: item.id,
      quantity: item.quantity,
      productId: item.productId,
      product: {
        ...item.product,
        price: Number(item.product.price),
        compareAtPrice: item.product.compareAtPrice
          ? Number(item.product.compareAtPrice)
          : null,
      },
      lineTotal: Number(item.product.price) * item.quantity,
    }));

    return {
      id: cart.id,
      items,
      itemCount: items.reduce((sum: number, i: (typeof items)[number]) => sum + i.quantity, 0),
      subtotal: items.reduce((sum: number, i: (typeof items)[number]) => sum + i.lineTotal, 0),
    };
  }

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: { include: { category: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: { product: { include: { category: true } } },
          },
        },
      });
    }

    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return this.toCartModel(cart);
  }

  async addItem(userId: string, productId: string, quantity = 1) {
    if (quantity < 1) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'Quantity must be at least 1');
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppException(404, ErrorCode.NOT_FOUND, 'Product not found');
    if (product.stock < quantity) {
      throw new AppException(400, ErrorCode.INSUFFICIENT_STOCK, 'Insufficient stock');
    }

    const cart = await this.getOrCreateCart(userId);
    const existing = cart.items.find((i) => i.productId === productId);

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stock < newQty) {
        throw new AppException(400, ErrorCode.INSUFFICIENT_STOCK, 'Insufficient stock');
      }
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    return this.getCart(userId);
  }

  async updateItemQuantity(userId: string, productId: string, quantity: number) {
    if (quantity < 1) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'Quantity must be at least 1');
    }

    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) throw new AppException(404, ErrorCode.NOT_FOUND, 'Item not in cart');

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.stock < quantity) {
      throw new AppException(400, ErrorCode.INSUFFICIENT_STOCK, 'Insufficient stock');
    }

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) throw new AppException(404, ErrorCode.NOT_FOUND, 'Item not in cart');

    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCart(userId);
  }
}
