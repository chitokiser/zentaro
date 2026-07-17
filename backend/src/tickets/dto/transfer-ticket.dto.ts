import { IsEmail, IsString, MinLength } from 'class-validator';

export class TransferTicketDto {
  @IsString()
  @MinLength(4)
  code: string;

  @IsEmail()
  toEmail: string;
}
