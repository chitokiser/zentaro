import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { InvestorWatchService } from './investor-watch.service';
import { InvestorWatchController } from './investor-watch.controller';

@Module({
  imports: [AuthModule, BlockchainModule],
  controllers: [InvestorWatchController],
  providers: [InvestorWatchService],
})
export class InvestorWatchModule {}
