import { IsIn, IsOptional } from 'class-validator';
import { AGING_ENVIRONMENTS, NEW_ORDER_BARREL_SIZES } from '../barrel-options';

export class CreateBarrelOrderDto {
  @IsIn(NEW_ORDER_BARREL_SIZES as unknown as string[])
  size: string;

  @IsOptional()
  @IsIn(AGING_ENVIRONMENTS as unknown as string[])
  agingEnvironment?: string;

  /** Omit to keep the existing auto EXP-then-ZP fallback; pass explicitly to force one method. */
  @IsOptional()
  @IsIn(['exp', 'zp', 'ztaro'])
  paymentMethod?: 'exp' | 'zp' | 'ztaro';
}
