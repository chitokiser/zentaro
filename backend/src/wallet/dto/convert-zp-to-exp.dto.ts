import { IsInt, Min } from 'class-validator';

export class ConvertZpToExpDto {
  @IsInt()
  @Min(1)
  amount: number;
}
