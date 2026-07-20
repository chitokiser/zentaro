import { IsOptional, IsString, MinLength } from 'class-validator';

export class ShippingAddressDto {
  @IsString()
  @MinLength(1)
  recipientName: string;

  @IsString()
  @MinLength(1)
  phone: string;

  @IsString()
  @MinLength(1)
  postalCode: string;

  @IsString()
  @MinLength(1)
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  deliveryMemo?: string;
}
