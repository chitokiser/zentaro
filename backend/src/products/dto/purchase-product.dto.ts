import { IsInt, IsOptional, Min } from 'class-validator';

export class PurchaseProductDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  expToUse?: number;
}
