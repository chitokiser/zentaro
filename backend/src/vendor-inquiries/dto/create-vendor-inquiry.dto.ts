import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateVendorInquiryDto {
  @IsString()
  @MinLength(1)
  productName: string;

  @IsString()
  @MinLength(1)
  companyName: string;

  @IsString()
  @MinLength(1)
  contactName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  phone: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsString()
  @MinLength(1)
  supplyPrice: string;

  @IsString()
  @MinLength(1)
  minOrderQty: string;

  @IsBoolean()
  sampleAvailable: boolean;
}
