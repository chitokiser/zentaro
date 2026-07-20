import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BottleCapsService } from './bottle-caps.service';
import { BottleCapsController } from './bottle-caps.controller';

@Module({
  imports: [AuthModule],
  controllers: [BottleCapsController],
  providers: [BottleCapsService],
})
export class BottleCapsModule {}
