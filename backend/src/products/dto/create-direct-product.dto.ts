import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateDirectProductDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsNumber()
  @Min(0)
  priceAp: number;

  @IsNumber()
  @Min(0)
  costAp: number;
}
