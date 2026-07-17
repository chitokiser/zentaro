"use client";

const TOKEN_KEY = "zentaro_token";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
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

export async function fetchWallet() {
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

export interface AdminProduct {
  id: string;
  name: string;
  category: string;
  priceAp: number;
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
  category: string;
  imageUrl?: string | null;
  cjSellPrice?: string;
  priceAp: number;
}) {
  const res = await fetch(`${API_URL}/products/import-cj`, {
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
