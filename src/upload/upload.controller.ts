import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { UploadService } from './upload.service';

const productStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, join(process.cwd(), 'uploads', 'products'));
  },
  filename: (_req, file, cb) => {
    const ext = file.originalname.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const categoryStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, join(process.cwd(), 'uploads', 'categories'));
  },
  filename: (_req, file, cb) => {
    const ext = file.originalname.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

@Controller('api/uploads')
@UseFilters(HttpExceptionFilter)
@UseGuards(AdminAuthGuard)
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Post('products/:productId/images')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: productStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadProductImage(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.upload.attachProductImage(productId, file);
  }

  @Delete('products/:productId/images')
  removeProductImage(
    @Param('productId') productId: string,
    @Body('imageUrl') imageUrl: string,
  ) {
    return this.upload.removeProductImage(productId, imageUrl);
  }

  @Post('categories/:categoryId/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: categoryStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadCategoryImage(
    @Param('categoryId') categoryId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.upload.attachCategoryImage(categoryId, file);
  }
}
