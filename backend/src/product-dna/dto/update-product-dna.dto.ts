import { IsInt, Max, Min } from 'class-validator';

export class UpdateProductDnaDto {
  @IsInt()
  @Min(1)
  @Max(5)
  botanical!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  sweetness!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  aroma!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  smoothness!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  purity!: number;
}
