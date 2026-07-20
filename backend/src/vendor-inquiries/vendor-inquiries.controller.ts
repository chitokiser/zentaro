import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { VendorInquiriesService } from './vendor-inquiries.service';
import { CreateVendorInquiryDto } from './dto/create-vendor-inquiry.dto';
import { UpdateVendorInquiryStatusDto } from './dto/update-vendor-inquiry-status.dto';

@Controller('vendor-inquiries')
export class VendorInquiriesController {
  constructor(private readonly vendorInquiriesService: VendorInquiriesService) {}

  @Post()
  submit(@Body() dto: CreateVendorInquiryDto) {
    return this.vendorInquiriesService.submit(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  listAll(@Query('status') status?: string) {
    return this.vendorInquiriesService.listAll(status);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateVendorInquiryStatusDto) {
    return this.vendorInquiriesService.updateStatus(id, dto.status);
  }
}
