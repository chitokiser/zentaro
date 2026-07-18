import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    FirebaseModule,
    AuthModule,
    WalletModule,
    ProductsModule,
    TicketsModule,
    CjModule,
    ContributionsModule,
    PostsModule,
    AiWriterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
