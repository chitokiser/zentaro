const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export interface Product {
  id: string;
  name: string;
  mainCategory?: string;
  category: string;
  priceAp: number;
  costAp?: number;
  fulfillmentType?: "dropshipping" | "direct";
  imageUrl: string | null;
  description: string;
  nameEn?: string | null;
  nameVi?: string | null;
  descriptionEn?: string | null;
  descriptionVi?: string | null;
  badges?: string[];
  badgesEn?: string[];
  badgesVi?: string[];
}

const FALLBACK_PRODUCTS: Product[] = [
  { id: "fallback-1", name: "ZENTARO Dry Gin", category: "Dry Gin", priceAp: 45000, imageUrl: null, description: "" },
  { id: "fallback-2", name: "Strawberry Liqueur", category: "Liqueur", priceAp: 38000, imageUrl: null, description: "" },
  { id: "fallback-3", name: "ZENTARO Whisky", category: "Whisky", priceAp: 72000, imageUrl: null, description: "" },
  { id: "fallback-4", name: "Herb Salt", category: "Herb Food", priceAp: 9000, imageUrl: null, description: "" },
  { id: "fallback-5", name: "Herb Pepper", category: "Herb Food", priceAp: 9000, imageUrl: null, description: "" },
  { id: "fallback-6", name: "Herb Cheese", category: "Herb Deli", priceAp: 15000, imageUrl: null, description: "" },
  { id: "fallback-7", name: "Herb Ham", category: "Herb Deli", priceAp: 22000, imageUrl: null, description: "" },
  { id: "fallback-8", name: "Herb Salami", category: "Herb Deli", priceAp: 24000, imageUrl: null, description: "" },
  { id: "fallback-9", name: "Herb Soap", category: "Herb Cosmetics", priceAp: 12000, imageUrl: null, description: "" },
  { id: "fallback-10", name: "Herb Shampoo", category: "Herb Cosmetics", priceAp: 18000, imageUrl: null, description: "" },
];

export async function getFeaturedProducts(mainCategory?: string): Promise<Product[]> {
  try {
    const params = mainCategory ? `?mainCategory=${encodeURIComponent(mainCategory)}` : "";
    const res = await fetch(`${API_URL}/products/featured${params}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return FALLBACK_PRODUCTS;
    const data = await res.json();
    if (!Array.isArray(data)) return FALLBACK_PRODUCTS;
    return mainCategory ? data : data.length > 0 ? data : FALLBACK_PRODUCTS;
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface WebzinePost {
  id: string;
  title: string;
  contentHtml: string;
  titleEn?: string | null;
  titleVi?: string | null;
  contentHtmlEn?: string | null;
  contentHtmlVi?: string | null;
  videoUrl: string | null;
  tags: string[];
  source: "ai" | "admin";
  authorName: string;
  published: boolean;
  createdAt?: { _seconds: number } | null;
}

export async function getPosts(tag?: string): Promise<WebzinePost[]> {
  try {
    const params = tag ? `?tag=${encodeURIComponent(tag)}` : "";
    const res = await fetch(`${API_URL}/posts${params}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getPost(id: string): Promise<WebzinePost | null> {
  try {
    const res = await fetch(`${API_URL}/posts/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
