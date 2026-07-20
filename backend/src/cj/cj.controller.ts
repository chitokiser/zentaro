import { Controller, Param, Query, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { RequireAdminLevel } from '../auth/admin-level.decorator';
import { CjService } from './cj.service';
import { SearchProductsDto } from './dto/search-products.dto';

@Controller('cj')
@UseGuards(JwtAuthGuard, AdminGuard)
@RequireAdminLevel(2)
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

  @Get(':pid')
  getDetail(@Param('pid') pid: string) {
    return this.cjService.getProductDetail(pid);
  }
}
