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
import { memoryStorage } from 'multer';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { UploadService } from './upload.service';

const uploadMemoryStorage = memoryStorage();

@Controller('api/uploads')
@UseFilters(HttpExceptionFilter)
@UseGuards(AdminAuthGuard)
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Post('products/:productId/images')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: uploadMemoryStorage,
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

  @Post('products/:productId/videos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: uploadMemoryStorage,
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadProductVideo(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.upload.attachProductVideo(productId, file);
  }

  @Delete('products/:productId/videos')
  removeProductVideo(
    @Param('productId') productId: string,
    @Body('videoUrl') videoUrl: string,
  ) {
    return this.upload.removeProductVideo(productId, videoUrl);
  }

  @Post('categories/:categoryId/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: uploadMemoryStorage,
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
