import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ZtaroPricingService } from './ztaro-pricing.service';

@Module({
  imports: [AuthModule],
  controllers: [ProductsController],
  providers: [ProductsService, ZtaroPricingService],
  exports: [ZtaroPricingService],
})
export class ProductsModule {}
