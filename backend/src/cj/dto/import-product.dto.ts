import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class ImportProductDto {
  @IsString()
  @MinLength(1)
  cjProductId: string;

  @IsString()
  @MinLength(1)
  name: string;

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
}
