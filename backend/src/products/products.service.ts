import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { ImportProductDto } from '../cj/dto/import-product.dto';
import { CreateDirectProductDto } from './dto/create-direct-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { computeZtaroPrice, ZtaroPricingService } from './ztaro-pricing.service';

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

  /** priceZtaro is server-computed only (discounted ZP price at today's snapshotted rate) — admins never set it directly. */
  private async ztaroPriceFields(priceAp: number, costAp: number) {
    const [zpPerZtaro, discountRate] = await Promise.all([
      this.ztaroPricing.getCurrentZpPerZtaro(),
      this.ztaroPricing.getDiscountRate(),
    ]);
    return { priceZtaro: computeZtaroPrice(priceAp, costAp, zpPerZtaro, discountRate) };
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

    // held is filtered in JS rather than as a Firestore `where` clause because most
    // existing product docs predate this field entirely — a `where('held', '==', false)`
    // query would silently exclude every doc that never got the field written.
    return snap.docs
      .filter((doc) => doc.data().held !== true)
      .map((doc) => stripAdminFields({ id: doc.id, ...doc.data() }));
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
      ...(await this.ztaroPriceFields(dto.priceAp, dto.costAp)),
      imageUrl: dto.imageUrl ?? null,
      held: !dto.imageUrl,
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
      ...(await this.ztaroPriceFields(dto.priceAp, dto.costAp)),
      imageUrl: dto.imageUrl ?? null,
      held: dto.held ?? !dto.imageUrl,
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
    const priceAp = dto.priceAp ?? existing.priceAp ?? 0;
    const costAp = dto.costAp ?? existing.costAp ?? priceAp;
    const imageUrl = dto.imageUrl !== undefined ? dto.imageUrl : existing.imageUrl;
    const held = dto.held !== undefined ? dto.held : !imageUrl;

    await ref.update({
      ...dto,
      held,
      ...(await this.ztaroPriceFields(priceAp, costAp)),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { id: productId };
  }

  /** Bulk-holds every product that currently has no imageUrl, so it drops out of public listings. */
  async holdProductsMissingImages(): Promise<{ held: number }> {
    const snap = await this.db.collection(COLLECTIONS.ZENTARO_PRODUCTS).get();
    const targets = snap.docs.filter((doc) => !doc.data().imageUrl && doc.data().held !== true);
    if (targets.length === 0) return { held: 0 };

    const batch = this.db.batch();
    targets.forEach((doc) => batch.update(doc.ref, { held: true, updatedAt: FieldValue.serverTimestamp() }));
    await batch.commit();
    return { held: targets.length };
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
