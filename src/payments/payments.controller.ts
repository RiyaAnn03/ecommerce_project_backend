import { Body, Controller, Headers, Post, Req, UseFilters } from '@nestjs/common';
import type { Request } from 'express';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { PaymentsService } from './payments.service';

@Controller('api/payments/razorpay')
@UseFilters(HttpExceptionFilter)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('webhook')
  async webhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: { event: string; payload: Record<string, unknown> },
  ) {
    const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(body);

    if (!signature || !this.payments.verifyWebhookSignature(rawBody, signature)) {
      return { received: false };
    }

    await this.payments.handleWebhookEvent(body.event, body.payload);
    return { received: true };
  }
}
