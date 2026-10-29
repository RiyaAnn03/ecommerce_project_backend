import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { AppException } from '../common/errors/app.exception';
import { ErrorCode } from '../common/errors/error-codes';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-matroska', // .mkv
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Cloudinary env vars are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  validateImageFile(file?: Express.Multer.File) {
    if (!file) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'No file uploaded');
    }
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      throw new AppException(
        400,
        ErrorCode.BAD_REQUEST,
        'Only JPEG, PNG, WebP, and GIF images are allowed',
      );
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'Image must be 5 MB or smaller');
    }
  }

  validateVideoFile(file?: Express.Multer.File) {
    if (!file) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'No file uploaded');
    }
    if (!ALLOWED_VIDEO_MIME.has(file.mimetype)) {
      throw new AppException(
        400,
        ErrorCode.BAD_REQUEST,
        'Only MP4, WebM, MOV, and MKV videos are allowed',
      );
    }
    if (file.size > MAX_VIDEO_SIZE) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'Video must be 50 MB or smaller');
    }
  }

  private async uploadToCloudinary(
    folder: string,
    file: Express.Multer.File,
    resourceType: 'image' | 'video' = 'image',
  ): Promise<{ url: string; publicId: string }> {
    if (!file.buffer?.length) {
      throw new AppException(400, ErrorCode.BAD_REQUEST, 'Invalid file upload');
    }

    const cloudFolder = process.env.CLOUDINARY_FOLDER?.trim() || 'ecommerce';

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${cloudFolder}/${folder}`,
          resource_type: resourceType,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) return reject(error ?? new Error('Upload failed'));
          resolve(uploadResult as { secure_url: string; public_id: string });
        },
      );

      stream.end(file.buffer);
    }).catch((e: unknown) => {
      throw new AppException(
        400,
        ErrorCode.UPLOAD_FAILED,
        e instanceof Error ? e.message : 'Upload failed',
      );
    });

    return { url: result.secure_url, publicId: result.public_id };
  }

  async attachProductImage(productId: string, file: Express.Multer.File) {
    this.validateImageFile(file);

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppException(404, ErrorCode.NOT_FOUND, 'Product not found');
    }

    const { url, publicId } = await this.uploadToCloudinary('products', file, 'image');
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
      publicId,
      images: updated.images,
    };
  }

  async attachProductVideo(productId: string, file: Express.Multer.File) {
    this.validateVideoFile(file);

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppException(404, ErrorCode.NOT_FOUND, 'Product not found');
    }

    const { url, publicId } = await this.uploadToCloudinary('products/videos', file, 'video');
    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { videos: { push: url } },
    });

    return {
      statusCode: 201,
      message: 'Product video uploaded',
      productId,
      url,
      publicId,
      videos: updated.videos,
    };
  }

  async attachCategoryImage(categoryId: string, file: Express.Multer.File) {
    this.validateImageFile(file);

    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new AppException(404, ErrorCode.NOT_FOUND, 'Category not found');
    }

    const { url, publicId } = await this.uploadToCloudinary('categories', file, 'image');
    const updated = await this.prisma.category.update({
      where: { id: categoryId },
      data: { imageUrl: url },
    });

    return {
      statusCode: 201,
      message: 'Category image uploaded',
      categoryId,
      url,
      publicId,
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

  async removeProductVideo(productId: string, videoUrl: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppException(404, ErrorCode.NOT_FOUND, 'Product not found');
    }

    const videos = product.videos.filter((v) => v !== videoUrl);
    if (videos.length === product.videos.length) {
      throw new AppException(404, ErrorCode.NOT_FOUND, 'Video not found on product');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { videos },
    });

    return {
      statusCode: 200,
      message: 'Product video removed',
      productId,
      videos: updated.videos,
    };
  }
}
