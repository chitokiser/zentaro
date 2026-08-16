import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { RequireAdminLevel } from '../auth/admin-level.decorator';
import { ProductDnaService } from './product-dna.service';
import { UpdateProductDnaDto } from './dto/update-product-dna.dto';

@Controller('product-dna')
export class ProductDnaController {
  constructor(private readonly productDna: ProductDnaService) {}

  @Get()
  getAll() {
    return this.productDna.getAll();
  }

  @Post(':slug')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  update(@Param('slug') slug: string, @Body() dto: UpdateProductDnaDto) {
    return this.productDna.upsert(slug, dto);
  }
}
