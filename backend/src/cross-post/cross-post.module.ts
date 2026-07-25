import { Module } from '@nestjs/common';
import { CrossPostService } from './cross-post.service';
import { TelegramBotService } from './telegram-bot.service';

@Module({
  providers: [CrossPostService, TelegramBotService],
  exports: [CrossPostService, TelegramBotService],
})
export class CrossPostModule { }
