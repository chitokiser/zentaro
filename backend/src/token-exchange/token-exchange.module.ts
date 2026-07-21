import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { TokenExchangeService } from './token-exchange.service';
import { TokenExchangeController } from './token-exchange.controller';

@Module({
  imports: [AuthModule, WalletModule, BlockchainModule],
  controllers: [TokenExchangeController],
  providers: [TokenExchangeService],
})
export class TokenExchangeModule {}
