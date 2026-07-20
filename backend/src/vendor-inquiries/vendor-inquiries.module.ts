import { Module } from '@nestjs/common';
import { VendorInquiriesController } from './vendor-inquiries.controller';
import { VendorInquiriesService } from './vendor-inquiries.service';

@Module({
  controllers: [VendorInquiriesController],
  providers: [VendorInquiriesService],
})
export class VendorInquiriesModule {}
