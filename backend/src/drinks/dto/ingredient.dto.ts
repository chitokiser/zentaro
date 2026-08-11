import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  isBotanical!: boolean;

  @IsOptional()
  @IsString()
  botanicalCategory?: string;
}

export class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isBotanical?: boolean;

  @IsOptional()
  @IsString()
  botanicalCategory?: string;
}
