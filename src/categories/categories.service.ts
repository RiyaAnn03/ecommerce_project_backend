import { Injectable } from '@nestjs/common';

import { AppException } from '../common/errors/app.exception';

import { ErrorCode } from '../common/errors/error-codes';

import { slugify } from '../common/utils/slugify';

import { PrismaService } from '../prisma/prisma.service';

import { CreateCategoryInput } from './dto/create-category.input';

import { UpdateCategoryInput } from './dto/update-category.input';



@Injectable()

export class CategoriesService {

  constructor(private readonly prisma: PrismaService) {}



  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {

    let slug = slugify(base);

    if (!slug) slug = 'category';

    let candidate = slug;

    let i = 1;

    while (true) {

      const existing = await this.prisma.category.findFirst({

        where: { slug: candidate, deletedAt: null },

      });

      if (!existing || existing.id === excludeId) return candidate;

      candidate = `${slug}-${i++}`;

    }

  }



  async findAll() {

    const activeWhere = { deletedAt: null };

    const deletedWhere = { deletedAt: { not: null } };



    const [categories, categoriesCount, deletedCategoriesCount] = await Promise.all([

      this.prisma.category.findMany({

        where: activeWhere,

        orderBy: { name: 'asc' },

      }),

      this.prisma.category.count({ where: activeWhere }),

      this.prisma.category.count({ where: deletedWhere }),

    ]);



    return { categories, categoriesCount, deletedCategoriesCount };

  }



  async findDeletedAll() {

    const where = { deletedAt: { not: null } };

    const categories = await this.prisma.category.findMany({

      where,

      orderBy: { name: 'asc' },

    });

    return {

      categories,

      categoriesCount: categories.length,

      deletedCategoriesCount: categories.length,

    };

  }



  findBySlug(slug: string) {

    return this.prisma.category.findFirst({

      where: { slug, deletedAt: null },

    });

  }



  findById(id: string) {

    return this.prisma.category.findFirst({

      where: { id, deletedAt: null },

    });

  }



  findByIdAdmin(id: string) {

    return this.prisma.category.findUnique({ where: { id } });

  }



  async findByIdOrThrow(id: string, includeDeleted = false) {

    const category = includeDeleted

      ? await this.findByIdAdmin(id)

      : await this.findById(id);

    if (!category) throw new AppException(404, ErrorCode.NOT_FOUND, 'Category not found');

    return category;

  }



  async create(input: CreateCategoryInput) {

    const slug = input.slug

      ? await this.uniqueSlug(input.slug)

      : await this.uniqueSlug(input.name);



    return this.prisma.category.create({

      data: {

        name: input.name.trim(),

        slug,

        description: input.description?.trim() || null,

      },

    });

  }



  async update(id: string, input: UpdateCategoryInput) {

    await this.findByIdOrThrow(id, true);



    let slug = input.slug;

    if (input.slug) slug = await this.uniqueSlug(input.slug, id);

    else if (input.name) slug = await this.uniqueSlug(input.name, id);



    return this.prisma.category.update({

      where: { id },

      data: {

        ...(input.name != null && { name: input.name.trim() }),

        ...(slug != null && { slug }),

        ...(input.description !== undefined && { description: input.description?.trim() || null }),

      },

    });

  }



  async delete(id: string) {

    await this.findByIdOrThrow(id);

    const productCount = await this.prisma.product.count({

      where: { categoryId: id, deletedAt: null },

    });

    if (productCount > 0) {

      throw new AppException(

        400,

        ErrorCode.BAD_REQUEST,

        'Cannot delete this category because products are assigned to it.',

      );

    }

    await this.prisma.category.update({

      where: { id },

      data: { deletedAt: new Date() },

    });

    return true;

  }



  async restore(id: string) {

    const category = await this.prisma.category.findFirst({

      where: { id, deletedAt: { not: null } },

    });

    if (!category) {

      throw new AppException(404, ErrorCode.NOT_FOUND, 'Deleted category not found');

    }



    const slugTaken = await this.prisma.category.findFirst({

      where: { slug: category.slug, deletedAt: null, NOT: { id } },

    });

    if (slugTaken) {

      throw new AppException(

        409,

        ErrorCode.CONFLICT,

        'Another active category already uses this slug',

      );

    }



    return this.prisma.category.update({

      where: { id },

      data: { deletedAt: null },

    });

  }

}


