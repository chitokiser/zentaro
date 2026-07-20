import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';

const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0';
const CJ_TOKEN_DOC = 'cj_api_token';

interface CjTokenDoc {
  accessToken: string;
  accessTokenExpiryDate: string;
  refreshToken: string;
  refreshTokenExpiryDate: string;
}

export interface CjSearchResultItem {
  cjProductId: string;
  name: string;
  imageUrl: string | null;
  sellPrice: string;
  category: string;
  sku: string;
}

export interface CjProductVariant {
  vid: string;
  sku: string;
  name: string;
  imageUrl: string | null;
  sellPrice: string;
}

export interface CjProductDetail {
  cjProductId: string;
  name: string;
  category: string;
  sellPrice: string;
  descriptionHtml: string;
  images: string[];
  variants: CjProductVariant[];
}

@Injectable()
export class CjService {
  private readonly logger = new Logger(CjService.name);

  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  private tokenRef() {
    return this.db.collection('config').doc(CJ_TOKEN_DOC);
  }

  private async getAccessToken(): Promise<string> {
    const snap = await this.tokenRef().get();
    if (!snap.exists) {
      throw new BadGatewayException(
        'CJ Dropshipping token is not configured (config/cj_api_token missing)',
      );
    }
    const data = snap.data() as CjTokenDoc;

    if (new Date(data.accessTokenExpiryDate).getTime() > Date.now()) {
      return data.accessToken;
    }

    return this.refreshAccessToken(data.refreshToken);
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    const res = await fetch(
      `${CJ_API_BASE}/v1/authentication/refreshAccessToken`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      },
    );
    const body = await res.json();
    if (!res.ok || !body.result) {
      this.logger.error(`CJ token refresh failed: ${JSON.stringify(body)}`);
      throw new BadGatewayException(
        'CJ Dropshipping access token expired and refresh failed. Check the CJ integration manually.',
      );
    }

    await this.tokenRef().set(body.data, { merge: true });
    return body.data.accessToken;
  }

  async searchProducts(
    keyword: string,
    pageNum: number,
    pageSize: number,
  ): Promise<{ total: number; items: CjSearchResultItem[] }> {
    const token = await this.getAccessToken();
    const params = new URLSearchParams({
      productNameEn: keyword,
      pageNum: String(pageNum),
      pageSize: String(pageSize),
    });

    const res = await fetch(`${CJ_API_BASE}/v1/product/list?${params}`, {
      headers: { 'CJ-Access-Token': token },
    });
    const body = await res.json();

    if (!res.ok || !body.result) {
      this.logger.error(`CJ product search failed: ${JSON.stringify(body)}`);
      throw new BadGatewayException(
        body.message ?? 'CJ Dropshipping product search failed',
      );
    }

    const items: CjSearchResultItem[] = (body.data?.list ?? []).map(
      (item: Record<string, unknown>) => ({
        cjProductId: item.pid as string,
        name: (item.productNameEn as string) ?? (item.productSku as string),
        imageUrl: (item.productImage as string) ?? null,
        sellPrice: (item.sellPrice as string) ?? '',
        category: (item.categoryName as string) ?? '',
        sku: (item.productSku as string) ?? '',
      }),
    );

    return { total: body.data?.total ?? items.length, items };
  }

  async getProductDetail(pid: string): Promise<CjProductDetail> {
    const token = await this.getAccessToken();
    const params = new URLSearchParams({ pid });

    const res = await fetch(`${CJ_API_BASE}/v1/product/query?${params}`, {
      headers: { 'CJ-Access-Token': token },
    });
    const body = await res.json();

    if (!res.ok || !body.result) {
      this.logger.error(`CJ product detail lookup failed: ${JSON.stringify(body)}`);
      throw new BadGatewayException(
        body.message ?? 'CJ Dropshipping product detail lookup failed',
      );
    }

    const data = (body.data ?? {}) as Record<string, unknown>;
    const variants = Array.isArray(data.variants) ? data.variants : [];
    const images = Array.isArray(data.productImageSet)
      ? (data.productImageSet as string[])
      : data.productImage
        ? [data.productImage as string]
        : [];

    return {
      cjProductId: (data.pid as string) ?? pid,
      name: (data.productNameEn as string) ?? (data.productSku as string) ?? '',
      category: (data.categoryName as string) ?? '',
      sellPrice: (data.sellPrice as string) ?? '',
      descriptionHtml: (data.description as string) ?? '',
      images,
      variants: variants.map((v: Record<string, unknown>) => ({
        vid: (v.vid as string) ?? '',
        sku: (v.variantSku as string) ?? '',
        name: (v.variantNameEn as string) ?? '',
        imageUrl: (v.variantImage as string) ?? null,
        sellPrice: (v.variantSellPrice as string) ?? '',
      })),
    };
  }
}
