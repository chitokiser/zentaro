import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { MALL_MAIN_CATEGORIES } from '../../common/mall-categories';

export class CreateDirectProductDto {
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
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[];

  @IsNumber()
  @Min(0)
  priceAp: number;

  @IsNumber()
  @Min(0)
  costAp: number;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  supplierContact?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  supplierCostKrw?: number;
}
