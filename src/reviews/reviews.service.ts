import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { resolvePagination } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewInput } from './dto/create-review.input';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private toReviewModel(review: {
    id: string;
    productId: string;
    orderId: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    user: { firstName: string; lastName: string };
  }) {
    return {
      id: review.id,
      productId: review.productId,
      orderId: review.orderId,
      rating: review.rating,
      comment: review.comment,
      userName: `${review.user.firstName} ${review.user.lastName}`.trim(),
      createdAt: review.createdAt,
    };
  }

  async create(userId: string, input: CreateReviewInput) {
    const order = await this.prisma.order.findFirst({
      where: { id: input.orderId, userId },
      include: { items: true },
    });
    if (!order) throw new AppException(404, ErrorCode.NOT_FOUND, 'Order not found');

    if (order.status !== OrderStatus.DELIVERED) {
      throw new AppException(
        400,
        ErrorCode.BAD_REQUEST,
        'You can only review products from delivered orders',
      );
    }

    const item = order.items.find((i) => i.productId === input.productId);
    if (!item) {
      throw new AppException(
        400,
        ErrorCode.BAD_REQUEST,
        'Product was not part of this order',
      );
    }

    const existing = await this.prisma.review.findUnique({
      where: {
        userId_productId_orderId: {
          userId,
          productId: input.productId,
          orderId: input.orderId,
        },
      },
    });
    if (existing) {
      throw new AppException(409, ErrorCode.CONFLICT, 'You already reviewed this product for this order');
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: input.productId,
        orderId: input.orderId,
        rating: input.rating,
        comment: input.comment?.trim() || null,
      },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    return this.toReviewModel(review);
  }

  async productReviews(productId: string, skip = 0, take = 10) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppException(404, ErrorCode.NOT_FOUND, 'Product not found');

    const pagination = resolvePagination({ skip, take });
    const where = { productId };

    const [rows, reviewsCount, avg] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
      }),
    ]);

    return {
      reviews: rows.map((r) => this.toReviewModel(r)),
      reviewsCount,
      averageRating: avg._avg.rating ?? 0,
    };
  }
}
