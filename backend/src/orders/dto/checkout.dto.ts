import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ShippingAddressDto } from '../../auth/dto/shipping-address.dto';

export class CheckoutItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CheckoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  expToUse?: number;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsOptional()
  @IsBoolean()
  saveAddress?: boolean;

  @IsOptional()
  @IsIn(['zp', 'ztaro'])
  paymentMethod?: 'zp' | 'ztaro';
}
