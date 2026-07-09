import { Injectable } from '@nestjs/common';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressInput } from './dto/create-address.input';
import { UpdateAddressInput } from './dto/update-address.input';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findById(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) throw new AppException(404, ErrorCode.NOT_FOUND, 'Address not found');
    return address;
  }

  async create(userId: string, input: CreateAddressInput) {
    const count = await this.prisma.address.count({ where: { userId } });
    const isDefault = input.isDefault ?? count === 0;

    if (isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        userId,
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        line1: input.line1.trim(),
        line2: input.line2?.trim() || null,
        city: input.city.trim(),
        state: input.state.trim(),
        postalCode: input.postalCode.trim(),
        country: input.country?.trim() || 'India',
        isDefault,
      },
    });
  }

  async update(userId: string, id: string, input: UpdateAddressInput) {
    await this.findById(userId, id);

    if (input.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id },
      data: {
        ...(input.fullName != null && { fullName: input.fullName.trim() }),
        ...(input.phone != null && { phone: input.phone.trim() }),
        ...(input.line1 != null && { line1: input.line1.trim() }),
        ...(input.line2 !== undefined && { line2: input.line2?.trim() || null }),
        ...(input.city != null && { city: input.city.trim() }),
        ...(input.state != null && { state: input.state.trim() }),
        ...(input.postalCode != null && { postalCode: input.postalCode.trim() }),
        ...(input.country != null && { country: input.country.trim() }),
        ...(input.isDefault != null && { isDefault: input.isDefault }),
      },
    });
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);
    await this.prisma.address.delete({ where: { id } });
    return true;
  }
}
