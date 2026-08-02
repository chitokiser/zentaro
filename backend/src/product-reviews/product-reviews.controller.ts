import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { ProductReviewsService } from './product-reviews.service';
import { CreateProductReviewDto } from './dto/create-product-review.dto';

@Controller('product-reviews')
export class ProductReviewsController {
  constructor(private readonly reviews: ProductReviewsService) {}

  @Get()
  list(@Query('productId') productId: string) {
    return this.reviews.listByProduct(productId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  upsert(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateProductReviewDto) {
    return this.reviews.upsert(user.uid, user.email, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteMine(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.reviews.deleteMine(user.uid, id);
  }
}
