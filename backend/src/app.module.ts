import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { ProductsModule } from './products/products.module';
import { TicketsModule } from './tickets/tickets.module';
import { CjModule } from './cj/cj.module';
import { ContributionsModule } from './contributions/contributions.module';
import { PostsModule } from './posts/posts.module';
import { AiWriterModule } from './ai-writer/ai-writer.module';
import { OrdersModule } from './orders/orders.module';
import { MailModule } from './mail/mail.module';
import { VendorInquiriesModule } from './vendor-inquiries/vendor-inquiries.module';
import { BottleCapsModule } from './bottle-caps/bottle-caps.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { ZtroRewardsModule } from './ztro-rewards/ztro-rewards.module';
import { TokenExchangeModule } from './token-exchange/token-exchange.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Global baseline rate limit (per IP); tighter limits can be layered onto
    // individual routes with @Throttle() where needed (e.g. login/register).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    FirebaseModule,
    AuthModule,
    WalletModule,
    ProductsModule,
    TicketsModule,
    CjModule,
    ContributionsModule,
    PostsModule,
    AiWriterModule,
    MailModule,
    OrdersModule,
    VendorInquiriesModule,
    BottleCapsModule,
    BlockchainModule,
    ZtroRewardsModule,
    TokenExchangeModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
