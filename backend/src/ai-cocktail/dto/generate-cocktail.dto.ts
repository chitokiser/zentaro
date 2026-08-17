import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateCocktailDto {
  @IsString()
  @MaxLength(100)
  productName!: string;

  @IsString()
  @MaxLength(100)
  productCategory!: string;

  @IsString()
  @MaxLength(1000)
  productDescription!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  abv?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  flavorHint?: string;

  @IsIn(['ko', 'en', 'vi'])
  locale!: 'ko' | 'en' | 'vi';
}
