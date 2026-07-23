import { IsIn, IsInt, Min } from 'class-validator';
import { FINISHING_OPTIONS } from '../barrel-options';

export class ApplyBarrelFinishingDto {
  @IsIn(Object.keys(FINISHING_OPTIONS))
  finishId: string;

  @IsInt()
  @Min(1)
  days: number;
}
