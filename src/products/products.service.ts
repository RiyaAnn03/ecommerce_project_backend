import { Injectable } from '@nestjs/common';
import { Prisma, SkillLevel } from '@prisma/client';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { SortOrder } from '../common/enums/sort-order.enum';
import { resolvePagination } from '../common/utils/pagination';
import { slugify } from '../common/utils/slugify';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput } from './dto/create-product.input';
import {
  ProductOrderByInput,
  ProductSortField,
  ProductWhereInput,
} from './dto/product-where.input';
import { UpdateProductInput } from './dto/update-product.input';

export type ProductListArgs = {
  where?: ProductWhereInput;
  search?: string;
  skip?: number;
  take?: number;
  orderBy?: ProductOrderByInput[];
};

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: Prisma.Decimal;
  compareAtPrice: Prisma.Decimal | null;
  images: string[];
  stock: number;
  yarnType: string | null;
  skillLevel: SkillLevel | null;
  patternIncluded: boolean;
  tags: string[];
  categoryId: string;
  createdAt: Date;
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    createdAt: Date;
  };
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private toProductModel(product: ProductRecord) {
    return {
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    };
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = slugify(base);
    if (!slug) slug = 'product';
    let candidate = slug;
    let i = 1;
    while (true) {
      const existing = await this.prisma.product.findFirst({
        where: { slug: candidate, deletedAt: null },
      });
      if (!existing || existing.id === excludeId) return candidate;
      candidate = `${slug}-${i++}`;
    }
  }

  private async ensureCategory(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
    });
    if (!category) throw new AppException(404, ErrorCode.NOT_FOUND, 'Category not found');
    return category;
  }

  private buildWhere(args: ProductListArgs, includeDeleted = false): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = includeDeleted
      ? { deletedAt: { not: null } }
      : { deletedAt: null, category: { deletedAt: null } };
    const filters = args.where ?? {};

    if (args.search?.trim()) {
      const q = args.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { has: q.toLowerCase() } },
      ];
    }

    if (filters.id) where.id = filters.id;

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    } else if (filters.categorySlug) {
      where.category = { slug: filters.categorySlug };
    }

    if (filters.minPrice != null || filters.maxPrice != null) {
      where.price = {};
      if (filters.minPrice != null) where.price.gte = filters.minPrice;
      if (filters.maxPrice != null) where.price.lte = filters.maxPrice;
    }

    if (filters.skillLevel) where.skillLevel = filters.skillLevel;
    if (filters.yarnType) where.yarnType = { equals: filters.yarnType, mode: 'insensitive' };
    if (filters.patternIncluded != null) where.patternIncluded = filters.patternIncluded;
    if (filters.tags?.length) where.tags = { hasSome: filters.tags };

    return where;
  }

  private buildOrderBy(
    orderBy?: ProductOrderByInput[],
  ): Prisma.ProductOrderByWithRelationInput[] {
    if (!orderBy?.length) {
      return [{ createdAt: 'desc' }];
    }

    return orderBy.map((item) => {
      const direction = item.direction === SortOrder.ASC ? 'asc' : 'desc';
      switch (item.field) {
        case ProductSortField.NAME:
          return { name: direction };
        case ProductSortField.PRICE:
          return { price: direction };
        default:
          return { createdAt: direction };
      }
    });
  }

  async findMany(args: ProductListArgs = {}) {
    const { skip, take } = resolvePagination({
      skip: args.skip,
      take: args.take ?? 10,
    });
    const activeWhere = this.buildWhere(args, false);
    const deletedWhere = this.buildWhere(args, true);

    const [products, productsCount, deletedProductsCount] = await Promise.all([
      this.prisma.product.findMany({
        where: activeWhere,
        skip,
        take,
        orderBy: this.buildOrderBy(args.orderBy),
        include: { category: true },
      }),
      this.prisma.product.count({ where: activeWhere }),
      this.prisma.product.count({ where: deletedWhere }),
    ]);

    return {
      products: products.map((p) => this.toProductModel(p)),
      productsCount,
      deletedProductsCount,
    };
  }

  async findDeletedMany(args: ProductListArgs = {}) {
    const { skip, take } = resolvePagination({
      skip: args.skip,
      take: args.take ?? 10,
    });
    const where = this.buildWhere(args, true);

    const [products, productsCount] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: this.buildOrderBy(args.orderBy),
        include: { category: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p) => this.toProductModel(p)),
      productsCount,
      deletedProductsCount: productsCount,
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null, category: { deletedAt: null } },
      include: { category: true },
    });
    return product ? this.toProductModel(product) : null;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { category: true },
    });
    return product ? this.toProductModel(product) : null;
  }

  async findByIdOrThrow(id: string, includeDeleted = false) {
    const product = await this.prisma.product.findFirst({
      where: includeDeleted ? { id } : { id, deletedAt: null },
      include: { category: true },
    });
    if (!product) throw new AppException(404, ErrorCode.NOT_FOUND, 'Product not found');
    return this.toProductModel(product);
  }

  async create(input: CreateProductInput) {
    await this.ensureCategory(input.categoryId);
    const slug = input.slug
      ? await this.uniqueSlug(input.slug)
      : await this.uniqueSlug(input.name);

    const existing = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null },
    });
    if (existing) {
      throw new AppException(409, ErrorCode.CONFLICT, 'Product slug already exists');
    }

    const product = await this.prisma.product.create({
      data: {
        name: input.name.trim(),
        slug,
        description: input.description.trim(),
        price: input.price,
        compareAtPrice: input.compareAtPrice,
        images: [],
        stock: input.stock,
        yarnType: input.yarnType?.trim() || null,
        skillLevel: input.skillLevel,
        patternIncluded: input.patternIncluded,
        tags: input.tags.map((t) => t.toLowerCase()),
        categoryId: input.categoryId,
      },
      include: { category: true },
    });

    return this.toProductModel(product);
  }

  async update(id: string, input: UpdateProductInput) {
    await this.findByIdOrThrow(id);

    if (input.categoryId) await this.ensureCategory(input.categoryId);

    let slug = input.slug;
    if (input.slug) slug = await this.uniqueSlug(input.slug, id);
    else if (input.name) slug = await this.uniqueSlug(input.name, id);

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(input.name != null && { name: input.name.trim() }),
        ...(slug != null && { slug }),
        ...(input.description != null && { description: input.description.trim() }),
        ...(input.price != null && { price: input.price }),
        ...(input.compareAtPrice !== undefined && { compareAtPrice: input.compareAtPrice }),
        ...(input.stock != null && { stock: input.stock }),
        ...(input.yarnType !== undefined && { yarnType: input.yarnType?.trim() || null }),
        ...(input.skillLevel !== undefined && { skillLevel: input.skillLevel }),
        ...(input.patternIncluded != null && { patternIncluded: input.patternIncluded }),
        ...(input.tags != null && { tags: input.tags.map((t) => t.toLowerCase()) }),
        ...(input.categoryId != null && { categoryId: input.categoryId }),
      },
      include: { category: true },
    });

    return this.toProductModel(product);
  }

  async delete(id: string) {
    await this.findByIdOrThrow(id);
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return true;
  }

  async restore(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: { not: null } },
    });
    if (!product) {
      throw new AppException(404, ErrorCode.NOT_FOUND, 'Deleted product not found');
    }

    const category = await this.prisma.category.findFirst({
      where: { id: product.categoryId, deletedAt: null },
    });
    if (!category) {
      throw new AppException(
        409,
        ErrorCode.CONFLICT,
        'Cannot restore product because its category is deleted. Restore the category first.',
      );
    }

    const restored = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: null },
      include: { category: true },
    });
    return this.toProductModel(restored);
  }

  async getFilterOptions() {
    const activeProductWhere = { deletedAt: null, category: { deletedAt: null } };
    const [yarnTypes, tags] = await Promise.all([
      this.prisma.product.findMany({
        where: { ...activeProductWhere, yarnType: { not: null } },
        select: { yarnType: true },
        distinct: ['yarnType'],
      }),
      this.prisma.product.findMany({
        where: activeProductWhere,
        select: { tags: true },
      }),
    ]);

    const tagSet = new Set<string>();
    for (const p of tags) {
      for (const tag of p.tags) tagSet.add(tag);
    }

    return {
      yarnTypes: yarnTypes.map((y) => y.yarnType).filter(Boolean) as string[],
      tags: [...tagSet].sort(),
      skillLevels: Object.values(SkillLevel),
    };
  }
}
