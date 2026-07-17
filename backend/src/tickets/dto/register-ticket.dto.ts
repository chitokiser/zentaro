import { IsString, MinLength } from 'class-validator';

export class RegisterTicketDto {
  @IsString()
  @MinLength(4)
  code: string;
}
