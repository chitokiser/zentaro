import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WhiskyMarketController } from './whisky-market.controller';
import { WhiskyMarketService } from './whisky-market.service';
import { WhiskyHunterAdapter } from './adapters/whisky-hunter.adapter';

@Module({
  imports: [AuthModule],
  controllers: [WhiskyMarketController],
  providers: [WhiskyMarketService, WhiskyHunterAdapter],
})
export class WhiskyMarketModule {}
