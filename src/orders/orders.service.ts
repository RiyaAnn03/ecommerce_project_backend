import { Inject, Injectable, forwardRef } from '@nestjs/common';
import {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { resolvePagination } from '../common/utils/pagination';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlaceOrderInput } from './dto/place-order.input';
import { UpdateOrderStatusInput } from './dto/update-order-status.input';

const orderInclude = {
  address: true,
  items: true,
  statusHistory: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.OrderInclude;

type OrderRecord = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  STANDARD: 40,
  EXPRESS: 80,
  PICKUP: 0,
};

const ONLINE_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.UPI,
  PaymentMethod.CARD,
  PaymentMethod.NET_BANKING,
];

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly payments: PaymentsService,
  ) {}

  private toOrderModel(order: OrderRecord) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      deliveryMethod: order.deliveryMethod,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      notes: order.notes,
      address: order.address,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSlug: item.productSlug,
        imageUrl: item.imageUrl,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
      })),
      statusHistory: order.statusHistory,
      placedAt: order.placedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
    };
  }

  private generateOrderNumber() {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `ORD-${stamp}-${rand}`;
  }

  async placeOrder(userId: string, input: PlaceOrderInput) {
    const address = await this.prisma.address.findFirst({
      where: { id: input.addressId, userId },
    });
    if (!address) {
      throw new AppException(404, ErrorCode.NOT_FOUND, 'Address not found');
    }

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!cart?.items.length) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'Cart is empty');
    }

    for (const item of cart.items) {
      if (item.product.deletedAt) {
        throw new AppException(
          400,
          ErrorCode.BAD_REQUEST,
          `Product "${item.product.name}" is no longer available. Remove it from cart.`,
        );
      }
      if (item.product.stock < item.quantity) {
        throw new AppException(
          400,
          ErrorCode.INSUFFICIENT_STOCK,
          `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}, in cart: ${item.quantity}`,
        );
      }
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );
    const deliveryFee = DELIVERY_FEES[input.deliveryMethod];
    const total = subtotal + deliveryFee;
    const isOnlinePayment = ONLINE_PAYMENT_METHODS.includes(input.paymentMethod);
    const paymentStatus = PaymentStatus.PENDING;

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const created = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          userId,
          addressId: address.id,
          status: OrderStatus.PENDING,
          deliveryMethod: input.deliveryMethod,
          paymentMethod: input.paymentMethod,
          paymentStatus,
          subtotal,
          deliveryFee,
          total,
          notes: input.notes?.trim() || null,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productSlug: item.product.slug,
              imageUrl: item.product.images[0] ?? null,
              unitPrice: item.product.price,
              quantity: item.quantity,
              lineTotal: Number(item.product.price) * item.quantity,
            })),
          },
          statusHistory: {
            create: {
              status: OrderStatus.PENDING,
              note: 'Order placed',
            },
          },
        },
        include: orderInclude,
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    const orderModel = this.toOrderModel(order);

    if (!isOnlinePayment) {
      return { order: orderModel, razorpay: null };
    }

    const razorpay = await this.payments.createRazorpayOrderForOrder(order);
    return { order: orderModel, razorpay };
  }

  async myOrders(userId: string, skip = 0, take = 10) {
    const pagination = resolvePagination({ skip, take });
    const where = { userId };

    const [orders, ordersCount] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { placedAt: 'desc' },
        include: orderInclude,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => this.toOrderModel(o)),
      ordersCount,
    };
  }

  async findById(userId: string, id: string, isAdmin = false) {
    const order = await this.prisma.order.findFirst({
      where: isAdmin ? { id } : { id, userId },
      include: orderInclude,
    });
    if (!order) throw new AppException(404, ErrorCode.NOT_FOUND, 'Order not found');
    return this.toOrderModel(order);
  }

  async findByOrderNumber(userId: string, orderNumber: string, isAdmin = false) {
    const order = await this.prisma.order.findFirst({
      where: isAdmin ? { orderNumber } : { orderNumber, userId },
      include: orderInclude,
    });
    if (!order) throw new AppException(404, ErrorCode.NOT_FOUND, 'Order not found');
    return this.toOrderModel(order);
  }

  async cancelOrder(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true },
    });
    if (!order) throw new AppException(404, ErrorCode.NOT_FOUND, 'Order not found');

    if (
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.OUT_FOR_DELIVERY ||
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new AppException(
        400,
        ErrorCode.BAD_REQUEST,
        `Cannot cancel order in ${order.status} status`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          ...(order.paymentStatus === PaymentStatus.PENDING && {
            paymentStatus: PaymentStatus.FAILED,
          }),
          statusHistory: {
            create: {
              status: OrderStatus.CANCELLED,
              note: 'Cancelled by customer',
            },
          },
        },
        include: orderInclude,
      });
    });

    return this.toOrderModel(updated);
  }

  async adminOrders(skip = 0, take = 10, status?: OrderStatus) {
    const pagination = resolvePagination({ skip, take });
    const where = status ? { status } : {};

    const [orders, ordersCount] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { placedAt: 'desc' },
        include: orderInclude,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => this.toOrderModel(o)),
      ordersCount,
    };
  }

  async updateStatus(id: string, input: UpdateOrderStatusInput) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppException(404, ErrorCode.NOT_FOUND, 'Order not found');

    if (order.status === OrderStatus.CANCELLED) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'Cannot update a cancelled order');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: input.status,
        ...(input.paymentStatus != null && { paymentStatus: input.paymentStatus }),
        ...(input.status === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
        ...(input.status === OrderStatus.CANCELLED && { cancelledAt: new Date() }),
        statusHistory: {
          create: {
            status: input.status,
            note: input.note?.trim() || `Status updated to ${input.status}`,
          },
        },
      },
      include: orderInclude,
    });

    return this.toOrderModel(updated);
  }
}
