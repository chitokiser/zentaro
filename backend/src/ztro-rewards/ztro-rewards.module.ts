import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ZtroRewardsService } from './ztro-rewards.service';
import { ZtroRewardsController } from './ztro-rewards.controller';

@Module({
  imports: [AuthModule, WalletModule, BlockchainModule],
  controllers: [ZtroRewardsController],
  providers: [ZtroRewardsService],
})
export class ZtroRewardsModule {}
