import { Controller, Query, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CjService } from './cj.service';
import { SearchProductsDto } from './dto/search-products.dto';

@Controller('cj')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CjController {
  constructor(private readonly cjService: CjService) {}

  @Get('search')
  search(@Query() dto: SearchProductsDto) {
    return this.cjService.searchProducts(
      dto.keyword,
      dto.pageNum ?? 1,
      dto.pageSize ?? 20,
    );
  }
}
