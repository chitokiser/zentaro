import { IsIn } from 'class-validator';
import { AGING_ENHANCEMENTS } from '../barrel-options';

export class AddBarrelEnhancementDto {
  @IsIn(Object.keys(AGING_ENHANCEMENTS))
  enhancementId: string;
}
