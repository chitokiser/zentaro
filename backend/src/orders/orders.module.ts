import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { WalletModule } from '../wallet/wallet.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [AuthModule, MailModule, WalletModule, BlockchainModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
