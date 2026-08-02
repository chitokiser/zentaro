import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductReviewsService } from './product-reviews.service';
import { ProductReviewsController } from './product-reviews.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProductReviewsController],
  providers: [ProductReviewsService],
})
export class ProductReviewsModule {}
