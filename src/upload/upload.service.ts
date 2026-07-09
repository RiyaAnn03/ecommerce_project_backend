import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SIZE = 5 * 1024 * 1024;

@Injectable()
export class UploadService {
  private readonly uploadRoot = join(process.cwd(), 'uploads');

  constructor(private readonly prisma: PrismaService) {}

  ensureDir(folder: string) {
    const dir = join(this.uploadRoot, folder);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  validateFile(file?: Express.Multer.File) {
    if (!file) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'No file uploaded');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new AppException(
        400,
        ErrorCode.BAD_REQUEST,
        'Only JPEG, PNG, WebP, and GIF images are allowed',
      );
    }
    if (file.size > MAX_SIZE) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'Image must be 5 MB or smaller');
    }
  }

  buildFilename(originalName: string): string {
    const ext = extname(originalName).toLowerCase() || '.jpg';
    return `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
  }

  buildPublicUrl(folder: string, filename: string): string {
    const base = process.env.APP_URL || `http://localhost:${process.env.PORT ?? 3000}`;
    return `${base}/uploads/${folder}/${filename}`;
  }

  async attachProductImage(productId: string, file: Express.Multer.File) {
    this.validateFile(file);

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppException(404, ErrorCode.NOT_FOUND, 'Product not found');
    }

    const url = this.buildPublicUrl('products', file.filename);
    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { images: { push: url } },
      include: { category: true },
    });

    return {
      statusCode: 201,
      message: 'Product image uploaded',
      productId,
      url,
      filename: file.filename,
      images: updated.images,
    };
  }

  async attachCategoryImage(categoryId: string, file: Express.Multer.File) {
    this.validateFile(file);

    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new AppException(404, ErrorCode.NOT_FOUND, 'Category not found');
    }

    const url = this.buildPublicUrl('categories', file.filename);
    const updated = await this.prisma.category.update({
      where: { id: categoryId },
      data: { imageUrl: url },
    });

    return {
      statusCode: 201,
      message: 'Category image uploaded',
      categoryId,
      url,
      filename: file.filename,
      imageUrl: updated.imageUrl,
    };
  }

  async removeProductImage(productId: string, imageUrl: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppException(404, ErrorCode.NOT_FOUND, 'Product not found');
    }

    const images = product.images.filter((img) => img !== imageUrl);
    if (images.length === product.images.length) {
      throw new AppException(404, ErrorCode.NOT_FOUND, 'Image not found on product');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { images },
    });

    return {
      statusCode: 200,
      message: 'Product image removed',
      productId,
      images: updated.images,
    };
  }
}
