import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { ProductsService } from './products.service';
import { ImportProductDto } from '../cj/dto/import-product.dto';
import { CreateDirectProductDto } from './dto/create-direct-product.dto';
import { PurchaseProductDto } from './dto/purchase-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('featured')
  getFeatured() {
    return this.productsService.getFeatured();
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  listAll() {
    return this.productsService.listAll();
  }

  @Post('import-cj')
  @UseGuards(JwtAuthGuard, AdminGuard)
  importFromCj(@Body() dto: ImportProductDto) {
    return this.productsService.importFromCj(dto);
  }

  @Post('direct')
  @UseGuards(JwtAuthGuard, AdminGuard)
  createDirect(@Body() dto: CreateDirectProductDto) {
    return this.productsService.createDirect(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/purchase')
  @UseGuards(JwtAuthGuard)
  purchase(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: PurchaseProductDto,
  ) {
    return this.productsService.purchase(user.uid, id, dto.expToUse ?? 0);
  }
}
