import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductDnaController } from './product-dna.controller';
import { ProductDnaService } from './product-dna.service';

@Module({
  imports: [AuthModule],
  controllers: [ProductDnaController],
  providers: [ProductDnaService],
})
export class ProductDnaModule {}
