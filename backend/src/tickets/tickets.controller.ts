import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { TicketsService } from './tickets.service';
import { RegisterTicketDto } from './dto/register-ticket.dto';
import { TransferTicketDto } from './dto/transfer-ticket.dto';
import { IssueTicketsDto } from './dto/issue-tickets.dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('mine')
  listMine(@CurrentUser() user: CurrentUserPayload) {
    return this.ticketsService.listMine(user.uid);
  }

  @Post('register')
  register(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RegisterTicketDto,
  ) {
    return this.ticketsService.register(user.uid, dto.code);
  }

  @Post('transfer')
  transfer(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: TransferTicketDto,
  ) {
    return this.ticketsService.transfer(user.uid, dto.code, dto.toEmail);
  }

  @Post(':code/use')
  use(@CurrentUser() user: CurrentUserPayload, @Param('code') code: string) {
    return this.ticketsService.use(user.uid, code);
  }

  @Post('issue')
  async issue(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: IssueTicketsDto,
  ) {
    await this.ticketsService.assertAdmin(user.uid);
    return this.ticketsService.issue(dto.source ?? 'admin', dto.count);
  }
}
