import { Module, OnModuleInit } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [AuthModule],
  controllers: [UploadController],
  providers: [UploadService, AdminAuthGuard],
})
export class UploadModule implements OnModuleInit {
  constructor(private readonly upload: UploadService) {}

  onModuleInit() {
    this.upload.ensureDir('products');
    this.upload.ensureDir('categories');
  }
}
