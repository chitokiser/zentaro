import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { RequireAdminLevel } from '../auth/admin-level.decorator';
import { ProductsService } from './products.service';
import { ImportProductDto } from '../cj/dto/import-product.dto';
import { CreateDirectProductDto } from './dto/create-direct-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateZtaroDiscountDto } from './dto/update-ztaro-discount.dto';
import { MALL_CATEGORIES } from '../common/mall-categories';
import { ZtaroPricingService } from './ztaro-pricing.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly ztaroPricing: ZtaroPricingService,
  ) {}

  @Get('featured')
  getFeatured(@Query('mainCategory') mainCategory?: string) {
    return this.productsService.getFeatured(mainCategory);
  }

  @Get('categories')
  getCategories() {
    return MALL_CATEGORIES;
  }

  @Get('ztaro-pricing-config')
  async getZtaroPricingConfig() {
    const [discountRate, zpPerZtaro] = await Promise.all([
      this.ztaroPricing.getDiscountRate(),
      this.ztaroPricing.getCurrentZpPerZtaro(),
    ]);
    return { discountRate, zpPerZtaro };
  }

  @Post('admin/ztaro-pricing-config')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(1)
  updateZtaroPricingConfig(@Body() dto: UpdateZtaroDiscountDto) {
    return this.ztaroPricing.updateDiscountRate(dto.discountPercent / 100);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  listAll() {
    return this.productsService.listAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.productsService.getOne(id);
  }

  @Post('import-cj')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  importFromCj(@Body() dto: ImportProductDto) {
    return this.productsService.importFromCj(dto);
  }

  @Post('direct')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  createDirect(@Body() dto: CreateDirectProductDto) {
    return this.productsService.createDirect(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
