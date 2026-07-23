import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class GoogleLoginDto {
  @IsString()
  @MinLength(10)
  idToken: string;

  @IsOptional()
  @IsEmail()
  referrerEmail?: string;
}
