import { Injectable } from '@nestjs/common';
import { ContactStatus, Prisma } from '@prisma/client';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { resolvePagination } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { ContactWhereInput } from './dto/contact-where.input';
import { SubmitContactInput } from './dto/submit-contact.input';

export type ContactListArgs = {
  where?: ContactWhereInput;
  search?: string;
  skip?: number;
  take?: number;
};

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(args: ContactListArgs): Prisma.ContactWhereInput {
    const where: Prisma.ContactWhereInput = {};

    if (args.where?.status) {
      where.status = args.where.status;
    }

    if (args.search?.trim()) {
      const q = args.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q } },
        { message: { contains: q, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  async submit(input: SubmitContactInput) {
    return this.prisma.contact.create({
      data: {
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        mobile: input.mobile.trim(),
        message: input.message.trim(),
        status: ContactStatus.NEW,
      },
    });
  }

  async findMany(args: ContactListArgs = {}) {
    const { skip, take } = resolvePagination({
      skip: args.skip,
      take: args.take ?? 10,
    });
    const where = this.buildWhere(args);

    const [contacts, contactsCount, newContactsCount] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contact.count({ where }),
      this.prisma.contact.count({
        where: {
          ...where,
          status: ContactStatus.NEW,
        },
      }),
    ]);

    return { contacts, contactsCount, newContactsCount };
  }

  async findById(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new AppException(404, ErrorCode.NOT_FOUND, 'Contact message not found');
    return contact;
  }

  async updateStatus(id: string, status: ContactStatus) {
    await this.findById(id);
    return this.prisma.contact.update({
      where: { id },
      data: { status },
    });
  }
}
