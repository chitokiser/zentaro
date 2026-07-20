import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { CreateVendorInquiryDto } from './dto/create-vendor-inquiry.dto';
import { VendorInquiryStatus } from './dto/update-vendor-inquiry-status.dto';

@Injectable()
export class VendorInquiriesService {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  private col() {
    return this.db.collection(COLLECTIONS.ZENTARO_VENDOR_INQUIRIES);
  }

  async submit(dto: CreateVendorInquiryDto) {
    const docRef = await this.col().add({
      ...dto,
      website: dto.website ?? null,
      status: 'pending' as VendorInquiryStatus,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { id: docRef.id };
  }

  async listAll(status?: string) {
    const snap = await this.col().orderBy('createdAt', 'desc').limit(500).get();
    const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return status ? docs.filter((d: any) => d.status === status) : docs;
  }

  async updateStatus(id: string, status: VendorInquiryStatus) {
    const ref = this.col().doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new NotFoundException('Inquiry not found');
    }
    await ref.update({ status, updatedAt: FieldValue.serverTimestamp() });
    return { id, status };
  }
}
