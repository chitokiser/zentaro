import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CjService } from './cj.service';
import { CjController } from './cj.controller';

@Module({
  imports: [AuthModule],
  controllers: [CjController],
  providers: [CjService],
  exports: [CjService],
})
export class CjModule {}
