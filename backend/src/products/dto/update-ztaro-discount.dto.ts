import { IsNumber, Max, Min } from 'class-validator';

export class UpdateZtaroDiscountDto {
  @IsNumber()
  @Min(0)
  @Max(90)
  discountPercent: number;
}
