import { IsInt, Min } from 'class-validator';

export class AmountDto {
  @IsInt()
  @Min(1)
  amount: number;
}
