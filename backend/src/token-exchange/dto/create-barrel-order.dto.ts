import { IsIn, IsOptional, IsString } from 'class-validator';
import { AGING_ENVIRONMENTS } from '../barrel-options';

export class CreateBarrelOrderDto {
  @IsString()
  size: string;

  @IsOptional()
  @IsIn(AGING_ENVIRONMENTS as unknown as string[])
  agingEnvironment?: string;

  /** Omit to keep the existing auto EXP-then-ZP fallback; pass explicitly to force one method. */
  @IsOptional()
  @IsIn(['exp', 'zp', 'ztaro'])
  paymentMethod?: 'exp' | 'zp' | 'ztaro';
}
