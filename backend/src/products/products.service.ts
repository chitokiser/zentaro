import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { ImportProductDto } from '../cj/dto/import-product.dto';
import { CreateDirectProductDto } from './dto/create-direct-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { computeZtaroPrice, LUXURY_MALL_CATEGORY, ZtaroPricingService } from './ztaro-pricing.service';

// Supplier info is internal sourcing/business data (who we buy from, at what
// cost) and must never reach the public storefront API, unlike costAp which
// already feeds the customer-facing EXP-discount calculation.
const ADMIN_ONLY_PRODUCT_FIELDS = ['supplierName', 'supplierContact', 'supplierCostKrw'] as const;

function stripAdminFields<T extends Record<string, unknown>>(product: T): T {
  const copy = { ...product };
  for (const field of ADMIN_ONLY_PRODUCT_FIELDS) {
    delete copy[field];
  }
  return copy;
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject(FIRESTORE) private readonly db: Firestore,
    private readonly ztaroPricing: ZtaroPricingService,
  ) { }

  /** priceZtaro is server-computed only (30%-off ZP price at today's snapshotted rate) — admins never set it directly. */
  private async luxuryPriceFields(mainCategory: string, priceAp: number) {
    if (mainCategory !== LUXURY_MALL_CATEGORY) return {};
    const zpPerZtaro = await this.ztaroPricing.getCurrentZpPerZtaro();
    return { priceZtaro: computeZtaroPrice(priceAp, zpPerZtaro) };
  }

  async getFeatured(mainCategory?: string) {
    // Filtering by mainCategory at the Firestore level (rather than fetching
    // a capped batch of all featured products and filtering in JS) avoids
    // silently truncating a category's results once the site-wide featured
    // count exceeds the query limit.
    let query = this.db
      .collection(COLLECTIONS.ZENTARO_PRODUCTS)
      .where('featured', '==', true);
    if (mainCategory) {
      query = query.where('mainCategory', '==', mainCategory);
    }
    const snap = await query.limit(500).get();

    return snap.docs.map((doc) => stripAdminFields({ id: doc.id, ...doc.data() }));
  }

  async listAll() {
    const snap = await this.db
      .collection(COLLECTIONS.ZENTARO_PRODUCTS)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async importFromCj(dto: ImportProductDto) {
    const docRef = await this.db.collection(COLLECTIONS.ZENTARO_PRODUCTS).add({
      name: dto.name,
      mainCategory: dto.mainCategory,
      category: dto.category,
      priceAp: dto.priceAp,
      costAp: dto.costAp,
      imageUrl: dto.imageUrl ?? null,
      description: `${dto.name} (CJ Dropshipping · ${dto.cjSellPrice ?? 'n/a'})`,
      cjProductId: dto.cjProductId,
      fulfillmentType: 'dropshipping',
      featured: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { id: docRef.id };
  }

  /**
   * Registers a product ZENTARO stocks and ships itself (Zentaro's own
   * spirits + curated world-famous liquors), as opposed to CJ dropshipping.
   */
  async createDirect(dto: CreateDirectProductDto) {
    const docRef = await this.db.collection(COLLECTIONS.ZENTARO_PRODUCTS).add({
      name: dto.name,
      mainCategory: dto.mainCategory,
      category: dto.category,
      priceAp: dto.priceAp,
      costAp: dto.costAp,
      stock: dto.stock ?? 100,
      ...(await this.luxuryPriceFields(dto.mainCategory, dto.priceAp)),
      imageUrl: dto.imageUrl ?? null,
      description: dto.description ?? dto.name,
      nameEn: dto.nameEn ?? null,
      nameVi: dto.nameVi ?? null,
      descriptionEn: dto.descriptionEn ?? null,
      descriptionVi: dto.descriptionVi ?? null,
      badges: dto.badges ?? [],
      badgesEn: dto.badgesEn ?? [],
      badgesVi: dto.badgesVi ?? [],
      fulfillmentType: 'direct',
      featured: true,
      supplierName: dto.supplierName ?? null,
      supplierContact: dto.supplierContact ?? null,
      supplierCostKrw: dto.supplierCostKrw ?? null,
      mentorRewardEnabled: dto.mentorRewardEnabled ?? false,
      level1MentorRate: dto.level1MentorRate ?? 5,
      level2MentorRate: dto.level2MentorRate ?? 5,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { id: docRef.id };
  }

  async getOne(productId: string) {
    const snap = await this.db
      .collection(COLLECTIONS.ZENTARO_PRODUCTS)
      .doc(productId)
      .get();
    if (!snap.exists) {
      throw new NotFoundException('Product not found');
    }
    return stripAdminFields({ id: snap.id, ...snap.data() });
  }

  async update(productId: string, dto: UpdateProductDto) {
    const ref = this.db.collection(COLLECTIONS.ZENTARO_PRODUCTS).doc(productId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new NotFoundException('Product not found');
    }
    const existing = snap.data()!;
    const mainCategory = dto.mainCategory ?? existing.mainCategory;
    const priceAp = dto.priceAp ?? existing.priceAp ?? 0;

    await ref.update({
      ...dto,
      ...(await this.luxuryPriceFields(mainCategory, priceAp)),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { id: productId };
  }

  async remove(productId: string) {
    const ref = this.db.collection(COLLECTIONS.ZENTARO_PRODUCTS).doc(productId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new NotFoundException('Product not found');
    }
    await ref.delete();
    return { id: productId };
  }
}
