import { IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { MALL_MAIN_CATEGORIES } from '../../common/mall-categories';

export class ImportProductDto {
  @IsString()
  @MinLength(1)
  cjProductId: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsIn(MALL_MAIN_CATEGORIES)
  mainCategory: string;

  @IsString()
  @MinLength(1)
  category: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  cjSellPrice?: string;

  @IsNumber()
  @Min(0)
  priceAp: number;

  @IsNumber()
  @Min(0)
  costAp: number;
}
