import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { AiWriterModule } from '../ai-writer/ai-writer.module';
import { TokenExchangeService } from './token-exchange.service';
import { TokenExchangeController } from './token-exchange.controller';

@Module({
  imports: [AuthModule, WalletModule, BlockchainModule, AiWriterModule],
  controllers: [TokenExchangeController],
  providers: [TokenExchangeService],
})
export class TokenExchangeModule {}
