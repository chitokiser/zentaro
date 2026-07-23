import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateVendorInquiryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  productName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  companyName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  contactName: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  supplyPrice: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  minOrderQty: string;

  @IsBoolean()
  sampleAvailable: boolean;
}
