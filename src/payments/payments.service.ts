import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';

type RazorpayCheckout = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
};

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private getKeyId(): string {
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      throw new AppException(500, ErrorCode.INTERNAL_ERROR, 'RAZORPAY_KEY_ID is not set');
    }
    return keyId;
  }

  private getKeySecret(): string {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new AppException(500, ErrorCode.INTERNAL_ERROR, 'RAZORPAY_KEY_SECRET is not set');
    }
    return keySecret;
  }

  private getClient(): Razorpay {
    if (!this.razorpay) {
      this.razorpay = new Razorpay({
        key_id: this.getKeyId(),
        key_secret: this.getKeySecret(),
      });
    }
    return this.razorpay;
  }

  private toPaise(amountInRupees: number): number {
    return Math.round(amountInRupees * 100);
  }

  async createRazorpayOrderForOrder(order: {
    id: string;
    orderNumber: string;
    total: { toString(): string } | number;
    razorpayOrderId: string | null;
  }): Promise<RazorpayCheckout> {
    if (order.razorpayOrderId) {
      const amount = Number(order.total);
      return {
        keyId: this.getKeyId(),
        razorpayOrderId: order.razorpayOrderId,
        amount,
        currency: 'INR',
      };
    }

    const amount = Number(order.total);
    const amountPaise = this.toPaise(amount);

    const razorpayOrder = await this.getClient().orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    return {
      keyId: this.getKeyId(),
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency: 'INR',
    };
  }

  verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): boolean {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = createHmac('sha256', this.getKeySecret()).update(body).digest('hex');

    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature));
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return false;

    const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  async verifyAndCompletePayment(
    userId: string,
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new AppException(404, ErrorCode.NOT_FOUND, 'Order not found');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return order;
    }

    if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
      throw new AppException(400, ErrorCode.PAYMENT_FAILED, 'Razorpay order mismatch');
    }

    const valid = this.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );

    if (!valid) {
      throw new AppException(400, ErrorCode.PAYMENT_FAILED, 'Invalid payment signature');
    }

    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        razorpayOrderId,
        razorpayPaymentId,
      },
    });
  }

  async handleWebhookEvent(event: string, payload: Record<string, unknown>) {
    if (event === 'payment.captured') {
      const payment = payload.payment as {
        entity?: { id?: string; order_id?: string };
      };
      const paymentId = payment?.entity?.id;
      const razorpayOrderId = payment?.entity?.order_id;

      if (!paymentId || !razorpayOrderId) return;

      const order = await this.prisma.order.findFirst({
        where: { razorpayOrderId },
      });

      if (!order || order.paymentStatus === PaymentStatus.PAID) return;

      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          razorpayPaymentId: paymentId,
        },
      });
    }
  }
}
