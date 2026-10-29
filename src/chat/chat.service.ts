import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';
import { ChatInput } from './dto/chat.input';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private getApiKey(): string {
    const key = process.env.GEMINI_API_KEY?.trim();
    if (!key) {
      throw new AppException(
        500,
        ErrorCode.INTERNAL_ERROR,
        'GEMINI_API_KEY is not set',
      );
    }
    // Google now issues Auth keys (AQ...) and legacy Standard keys (AIza...)
    if (!key.startsWith('AIza') && !key.startsWith('AQ.')) {
      throw new AppException(
        500,
        ErrorCode.INTERNAL_ERROR,
        'Invalid GEMINI_API_KEY. Create one at https://aistudio.google.com/apikey',
      );
    }
    return key;
  }

  private getModelName(): string {
    return process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash-lite';
  }

  private mapGeminiError(error: unknown): AppException {
    const msg =
      error instanceof Error ? error.message : 'Failed to get chatbot response';

    if (
      msg.includes('429') ||
      msg.toLowerCase().includes('quota') ||
      msg.toLowerCase().includes('rate-limit') ||
      msg.toLowerCase().includes('too many requests')
    ) {
      return new AppException(
        429,
        ErrorCode.RATE_LIMITED,
        'Gemini free quota exceeded. Wait a minute and try again, or create a new API key.',
      );
    }

    if (
      msg.includes('401') ||
      msg.includes('403') ||
      msg.toLowerCase().includes('api key') ||
      msg.toLowerCase().includes('permission')
    ) {
      return new AppException(
        401,
        ErrorCode.UNAUTHENTICATED,
        'Invalid Gemini API key. Create a new key at https://aistudio.google.com/apikey',
      );
    }

    if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
      return new AppException(
        400,
        ErrorCode.BAD_REQUEST,
        `Gemini model not found. Set GEMINI_MODEL to a valid model (current: ${this.getModelName()}).`,
      );
    }

    // eslint-disable-next-line no-console
    console.error('[ChatService] Gemini error:', msg);

    return new AppException(
      500,
      ErrorCode.INTERNAL_ERROR,
      'Chatbot is temporarily unavailable. Check GEMINI_API_KEY and GEMINI_MODEL in .env',
    );
  }

  private async getStoreContext(): Promise<string> {
    // Keep context small to save free-tier tokens.
    const [categories, products] = await Promise.all([
      this.prisma.category.findMany({
        where: { deletedAt: null },
        select: { name: true },
        orderBy: { name: 'asc' },
        take: 10,
      }),
      this.prisma.product.findMany({
        where: { deletedAt: null, category: { deletedAt: null } },
        select: {
          name: true,
          price: true,
          stock: true,
          category: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const categoryLines = categories.map((c) => `- ${c.name}`).join('\n');
    const productLines = products
      .map(
        (p) =>
          `- ${p.name} | ${p.category.name} | ₹${Number(p.price)} | stock ${p.stock}`,
      )
      .join('\n');

    return [
      'Store categories:',
      categoryLines || '- none',
      '',
      'Available products (sample):',
      productLines || '- none',
    ].join('\n');
  }

  async chat(input: ChatInput) {
    const message = input.message.trim();
    if (!message) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'Message is required');
    }

    const storeContext = await this.getStoreContext();

    const systemInstruction = [
      'You are a helpful shopping assistant for an ecommerce yarn and crochet store.',
      'Answer politely and briefly (2-5 short sentences unless the user asks for more detail).',
      'Help with products, categories, stock, prices, shipping basics, and order help.',
      'If you recommend products, use only products from the store context.',
      'If information is missing, say so and suggest contacting support via the contact form.',
      'Do not invent payment card details, order IDs, or private user data.',
      '',
      storeContext,
    ].join('\n');

    try {
      const genAI = new GoogleGenerativeAI(this.getApiKey());
      const model = genAI.getGenerativeModel({
        model: this.getModelName(),
        systemInstruction,
      });

      const history = (input.history ?? [])
        .filter((h) => h.content?.trim())
        .slice(-8)
        .map((h) => ({
          role: h.role,
          parts: [{ text: h.content.trim() }],
        }));

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(message);
      const reply = result.response.text()?.trim();

      if (!reply) {
        throw new AppException(
          500,
          ErrorCode.INTERNAL_ERROR,
          'Chatbot returned an empty response',
        );
      }

      return { reply };
    } catch (error) {
      if (error instanceof AppException) throw error;
      throw this.mapGeminiError(error);
    }
  }
}
