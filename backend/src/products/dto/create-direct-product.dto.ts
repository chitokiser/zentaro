import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, Min, MinLength, IsBoolean } from 'class-validator';
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
  nameEn?: string;

  @IsOptional()
  @IsString()
  nameVi?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  descriptionVi?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badgesEn?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badgesVi?: string[];

  @IsNumber()
  @Min(0)
  priceAp: number;

  @IsNumber()
  @Min(0)
  costAp: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  /** Explicit hold override. When omitted, held auto-follows whether imageUrl is set. */
  @IsOptional()
  @IsBoolean()
  held?: boolean;

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

  @IsOptional()
  @IsBoolean()
  mentorRewardEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  level1MentorRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  level2MentorRate?: number;
}
