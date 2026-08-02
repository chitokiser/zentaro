import { IsIn, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

/** Static product ids used by the /about/products brand showcase page (frontend/src/app/about/products/page.tsx). */
export const REVIEWABLE_PRODUCT_IDS = [
  'zentaro-blue',
  'zentaro-origin',
  'zentaro-st',
  'zentaro-an',
  'zentaro-oak',
] as const;

export class CreateProductReviewDto {
  @IsIn(REVIEWABLE_PRODUCT_IDS)
  productId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  comment: string;
}
