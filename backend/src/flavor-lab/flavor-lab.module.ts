import { Module } from '@nestjs/common';
import { FlavorLabController } from './flavor-lab.controller';
import { FlavorLabService } from './flavor-lab.service';

@Module({
  controllers: [FlavorLabController],
  providers: [FlavorLabService],
  exports: [FlavorLabService],
})
export class FlavorLabModule {}
