const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export interface Product {
  id: string;
  name: string;
  category: string;
  priceAp: number;
  costAp?: number;
  fulfillmentType?: "dropshipping" | "direct";
  imageUrl: string | null;
  description: string;
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

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/products/featured`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return FALLBACK_PRODUCTS;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_PRODUCTS;
  } catch {
    return FALLBACK_PRODUCTS;
  }
}
