import { IsIn } from 'class-validator';

export const VENDOR_INQUIRY_STATUSES = ['pending', 'reviewed', 'contacted', 'rejected'] as const;
export type VendorInquiryStatus = (typeof VENDOR_INQUIRY_STATUSES)[number];

export class UpdateVendorInquiryStatusDto {
  @IsIn(VENDOR_INQUIRY_STATUSES)
  status: VendorInquiryStatus;
}
