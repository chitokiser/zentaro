"use client";

const TOKEN_KEY = "zentaro_token";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

const AUTH_CHANGED_EVENT = "zentaro:auth-changed";

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function onAuthChanged(callback: () => void) {
  window.addEventListener(AUTH_CHANGED_EVENT, callback);
  return () => window.removeEventListener(AUTH_CHANGED_EVENT, callback);
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function register(email: string, password: string, displayName: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  const data = await res.json();
  setToken(data.accessToken);
  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  const data = await res.json();
  setToken(data.accessToken);
  return data;
}

export async function loginWithGoogle(idToken: string) {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  const data = await res.json();
  setToken(data.accessToken);
  return data;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) throw new Error("로그인이 필요합니다.");
  return { Authorization: `Bearer ${token}` };
}

export interface Me {
  uid: string;
  email: string | null;
  isAdmin: boolean;
}

export async function fetchMe(): Promise<Me> {
  const res = await fetch(`${API_URL}/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface Wallet {
  ap: number;
  exp: number;
  timeToken: number;
  jumpToken: number;
  rewardPoint: number;
  tickets: string[];
  nfts: string[];
}

export async function fetchWallet(): Promise<Wallet> {
  const res = await fetch(`${API_URL}/wallet`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface Ticket {
  code: string;
  ownerId: string | null;
  status: "unused" | "used";
  source: string;
}

export async function fetchMyTickets(): Promise<Ticket[]> {
  const res = await fetch(`${API_URL}/tickets/mine`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function registerTicket(code: string) {
  const res = await fetch(`${API_URL}/tickets/register`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function transferTicket(code: string, toEmail: string) {
  const res = await fetch(`${API_URL}/tickets/transfer`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ code, toEmail }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function useTicket(code: string) {
  const res = await fetch(`${API_URL}/tickets/${code}/use`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface CjSearchResultItem {
  cjProductId: string;
  name: string;
  imageUrl: string | null;
  sellPrice: string;
  category: string;
  sku: string;
}

export type FulfillmentType = "dropshipping" | "direct";

export interface AdminProduct {
  id: string;
  name: string;
  mainCategory?: string;
  category: string;
  priceAp: number;
  costAp?: number;
  fulfillmentType?: FulfillmentType;
  imageUrl: string | null;
  cjProductId?: string;
  featured: boolean;
}

export async function searchCjProducts(keyword: string, pageNum = 1) {
  const params = new URLSearchParams({ keyword, pageNum: String(pageNum), pageSize: "20" });
  const res = await fetch(`${API_URL}/cj/search?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json() as Promise<{ total: number; items: CjSearchResultItem[] }>;
}

export async function importCjProduct(input: {
  cjProductId: string;
  name: string;
  mainCategory: string;
  category: string;
  imageUrl?: string | null;
  cjSellPrice?: string;
  priceAp: number;
  costAp: number;
}) {
  const res = await fetch(`${API_URL}/products/import-cj`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function createDirectProduct(input: {
  name: string;
  mainCategory: string;
  category: string;
  description?: string;
  imageUrl?: string | null;
  priceAp: number;
  costAp: number;
}) {
  const res = await fetch(`${API_URL}/products/direct`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchAllProductsAdmin(): Promise<AdminProduct[]> {
  const res = await fetch(`${API_URL}/products`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function deleteProductAdmin(id: string) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface AdminPost {
  id: string;
  title: string;
  contentHtml: string;
  videoUrl: string | null;
  tags: string[];
  source: "ai" | "admin";
  authorName: string;
  published: boolean;
  createdAt?: { _seconds: number } | null;
}

export async function fetchAllPostsAdmin(): Promise<AdminPost[]> {
  const res = await fetch(`${API_URL}/posts/admin/all`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function createPost(input: {
  title: string;
  contentHtml: string;
  videoUrl?: string;
  tags: string[];
}) {
  const res = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function deletePostAdmin(id: string) {
  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function generateAiPost(tag?: string) {
  const res = await fetch(`${API_URL}/ai-writer/generate`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ tag }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function purchaseProduct(id: string, expToUse = 0) {
  const res = await fetch(`${API_URL}/products/${id}/purchase`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ expToUse }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json() as Promise<{
    orderId: string;
    apPaid: number;
    expPaid: number;
    remainingAp: number;
    remainingExp: number;
  }>;
}

export const CONTRIBUTION_ITEM_LABELS: Record<string, string> = {
  oak_barrel: "오크통",
  brandy: "브랜디",
  whisky: "위스키",
  gin: "진",
  rum: "럼",
  other: "기타",
};

export interface Contribution {
  id: string;
  userId: string;
  email: string;
  itemType: string;
  quantity: number;
  description: string;
  contactPhone: string;
  address: string | null;
  status: "pending" | "approved" | "rejected";
  apAmount: number | null;
  rejectReason: string | null;
  createdAt?: { _seconds: number } | null;
}

export async function submitContribution(input: {
  itemType: string;
  quantity: number;
  description: string;
  contactPhone: string;
  address?: string;
}) {
  const res = await fetch(`${API_URL}/contributions`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchMyContributions(): Promise<Contribution[]> {
  const res = await fetch(`${API_URL}/contributions/mine`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchAllContributionsAdmin(): Promise<Contribution[]> {
  const res = await fetch(`${API_URL}/contributions`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function approveContribution(id: string, apAmount: number) {
  const res = await fetch(`${API_URL}/contributions/${id}/approve`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ apAmount }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function rejectContribution(id: string, reason?: string) {
  const res = await fetch(`${API_URL}/contributions/${id}/reject`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}
