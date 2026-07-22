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
  photoUrl: string | null;
  isAdmin: boolean;
  adminLevel: 1 | 2 | 3 | null;
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

export interface ZtroRewardResult {
  amount: number;
  txHash: string;
  walletAddress: string;
}

export async function redeemZtroQr(code: string): Promise<ZtroRewardResult> {
  const res = await fetch(`${API_URL}/ztro-rewards/redeem`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface ZtroRewardCodeItem {
  code: string;
  qrDataUrl: string;
}

export async function issueZtroRewardCodes(
  count: number,
  baseValue: number,
): Promise<{ issued: number; items: ZtroRewardCodeItem[] }> {
  const res = await fetch(`${API_URL}/ztro-rewards/issue`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ count, baseValue }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface ZtroRewardCode {
  code: string;
  baseValue: number;
  status: "unused" | "pending" | "used" | "failed";
  claimedBy: string | null;
  amount: number | null;
  txHash: string | null;
  createdAt?: { _seconds: number } | null;
}

export async function fetchZtroPoolBalance(): Promise<{ balance: number }> {
  const res = await fetch(`${API_URL}/ztro-rewards/admin/pool-balance`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function listZtroRewardCodes(): Promise<ZtroRewardCode[]> {
  const res = await fetch(`${API_URL}/ztro-rewards/admin/list`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface ExchangeDashboard {
  address: string;
  ztroBalance: number;
  usdtBalance: number;
  priceUsdt: number;
  staked: number;
  stakingTime: number;
  lastClaim: number;
  avgBuyPriceUsdt: number;
  pnlUsdt: number;
  roiBps: number;
  pendingDividendUsdt: number;
  effectiveStaked: number;
  act: number;
  sellFeePercent: number;
  stakeLockSeconds: number;
  divIntervalSeconds: number;
  usdtTokenAddress: string;
}

export async function fetchExchangeDashboard(): Promise<ExchangeDashboard> {
  const res = await fetch(`${API_URL}/token-exchange/dashboard`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function buyZtro(amount: number, maxPayUsdt?: number) {
  const res = await fetch(`${API_URL}/token-exchange/buy`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount, maxPayUsdt }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function sellZtro(amount: number) {
  const res = await fetch(`${API_URL}/token-exchange/sell`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function stakeZtro(amount: number) {
  const res = await fetch(`${API_URL}/token-exchange/stake`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function unstakeZtro() {
  const res = await fetch(`${API_URL}/token-exchange/unstake`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function claimZtroDividend() {
  const res = await fetch(`${API_URL}/token-exchange/claim-dividend`, {
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
  description?: string;
  badges?: string[];
  priceAp: number;
  costAp?: number;
  fulfillmentType?: FulfillmentType;
  imageUrl: string | null;
  cjProductId?: string;
  featured: boolean;
  supplierName?: string | null;
  supplierContact?: string | null;
  supplierCostKrw?: number | null;
}

export async function searchCjProducts(keyword: string, pageNum = 1) {
  const params = new URLSearchParams({ keyword, pageNum: String(pageNum), pageSize: "20" });
  const res = await fetch(`${API_URL}/cj/search?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json() as Promise<{ total: number; items: CjSearchResultItem[] }>;
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

export async function fetchCjProductDetail(pid: string) {
  const res = await fetch(`${API_URL}/cj/${pid}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json() as Promise<CjProductDetail>;
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
  badges?: string[];
  priceAp: number;
  costAp: number;
  supplierName?: string;
  supplierContact?: string;
  supplierCostKrw?: number;
}) {
  const res = await fetch(`${API_URL}/products/direct`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function updateProductAdmin(
  id: string,
  input: Partial<{
    name: string;
    mainCategory: string;
    category: string;
    description: string;
    imageUrl: string;
    badges: string[];
    priceAp: number;
    costAp: number;
    supplierName: string;
    supplierContact: string;
    supplierCostKrw: number;
  }>,
) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
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

export async function updatePost(
  id: string,
  input: Partial<{
    title: string;
    contentHtml: string;
    videoUrl: string;
    tags: string[];
  }>,
) {
  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "PUT",
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

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  deliveryMemo?: string;
}

export async function fetchShippingAddress(): Promise<ShippingAddress | null> {
  const res = await fetch(`${API_URL}/auth/shipping-address`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function updateShippingAddress(input: ShippingAddress): Promise<ShippingAddress> {
  const res = await fetch(`${API_URL}/auth/shipping-address`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface CheckoutOrderItem {
  productId: string;
  quantity: number;
  productName: string;
  fulfillmentType: FulfillmentType;
  priceAp: number;
  costAp: number;
  apPaid: number;
  expPaid: number;
}

export interface AdminOrder {
  id: string;
  userId: string;
  items: CheckoutOrderItem[];
  shippingAddress: ShippingAddress;
  totalPriceAp: number;
  totalCostAp: number;
  totalApPaid: number;
  totalExpPaid: number;
  status: "paid" | "shipped" | "delivered" | "cancelled";
  createdAt?: { _seconds: number } | null;
}

export async function checkoutCart(input: {
  items: Array<{ productId: string; quantity: number }>;
  expToUse?: number;
  shippingAddress: ShippingAddress;
  saveAddress?: boolean;
}) {
  const res = await fetch(`${API_URL}/orders/checkout`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json() as Promise<{
    orderId: string;
    totalApPaid: number;
    totalExpPaid: number;
    remainingAp: number;
    remainingExp: number;
  }>;
}

export async function fetchAllOrders(status?: string): Promise<AdminOrder[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`${API_URL}/orders${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function updateOrderStatus(id: string, status: string) {
  const res = await fetch(`${API_URL}/orders/${id}/status`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchUnreadOrderCount(): Promise<{ count: number }> {
  const res = await fetch(`${API_URL}/orders/unread-count`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface SalesReportRow {
  date: string;
  fulfillmentType: string;
  orderCount: number;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  totalApPaid: number;
  totalExpPaid: number;
}

export interface SalesReport {
  startDate: string;
  endDate: string;
  totals: {
    orderCount: number;
    totalRevenue: number;
    totalCost: number;
    totalMargin: number;
    totalApPaid: number;
    totalExpPaid: number;
  };
  byDateType: SalesReportRow[];
}

export async function fetchSalesReport(startDate?: string, endDate?: string): Promise<SalesReport> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();
  const res = await fetch(`${API_URL}/orders/report${qs ? `?${qs}` : ""}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
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

export interface BottleCapClaim {
  id: string;
  userId: string;
  email: string;
  isZentaro: boolean;
  brand: string;
  quantity: number;
  sealConfirmed: boolean;
  contactPhone: string;
  trackingNumber: string | null;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  apAmount: number | null;
  expAmount: number | null;
  rejectReason: string | null;
  createdAt?: { _seconds: number } | null;
}

export async function submitBottleCapClaim(input: {
  isZentaro: boolean;
  brand: string;
  quantity: number;
  sealConfirmed: boolean;
  contactPhone: string;
  trackingNumber?: string;
  note?: string;
}) {
  const res = await fetch(`${API_URL}/bottle-cap-claims`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchMyBottleCapClaims(): Promise<BottleCapClaim[]> {
  const res = await fetch(`${API_URL}/bottle-cap-claims/mine`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchAllBottleCapClaimsAdmin(): Promise<BottleCapClaim[]> {
  const res = await fetch(`${API_URL}/bottle-cap-claims`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function approveBottleCapClaim(id: string, apAmount: number) {
  const res = await fetch(`${API_URL}/bottle-cap-claims/${id}/approve`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ apAmount }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function rejectBottleCapClaim(id: string, reason?: string) {
  const res = await fetch(`${API_URL}/bottle-cap-claims/${id}/reject`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface VendorInquiry {
  id: string;
  productName: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  supplyPrice: string;
  minOrderQty: string;
  sampleAvailable: boolean;
  status: "pending" | "reviewed" | "contacted" | "rejected";
  createdAt?: { _seconds: number } | null;
}

export async function submitVendorInquiry(input: {
  productName: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  supplyPrice: string;
  minOrderQty: string;
  sampleAvailable: boolean;
}) {
  const res = await fetch(`${API_URL}/vendor-inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchVendorInquiries(status?: string): Promise<VendorInquiry[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`${API_URL}/vendor-inquiries${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function updateVendorInquiryStatus(id: string, status: VendorInquiry["status"]) {
  const res = await fetch(`${API_URL}/vendor-inquiries/${id}/status`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface AdminUserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  adminLevel: 1 | 2 | 3 | null;
}

export async function fetchAdminUsers(): Promise<AdminUserSummary[]> {
  const res = await fetch(`${API_URL}/auth/admin-users`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function promoteAdminUser(email: string, adminLevel: 1 | 2 | 3) {
  const res = await fetch(`${API_URL}/auth/admin-users`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ email, adminLevel }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function setAdminUserLevel(uid: string, adminLevel: 1 | 2 | 3 | null) {
  const res = await fetch(`${API_URL}/auth/admin-users/${uid}/level`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ adminLevel }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface MemberSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  points: number;
  exp: number;
  adminLevel: 1 | 2 | 3 | null;
  chainAddress: string | null;
  createdAt?: { _seconds: number } | null;
}

export async function fetchAllMembersAdmin(): Promise<MemberSummary[]> {
  const res = await fetch(`${API_URL}/wallet/admin/members`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function adjustMemberExp(uid: string, amount: number, reason?: string) {
  const res = await fetch(`${API_URL}/wallet/admin/members/${uid}/exp`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount, reason }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface LedgerTransaction {
  id: string;
  userId: string;
  email: string | null;
  amount: number;
  type: string;
  description: string;
  createdAt?: { _seconds: number } | null;
}

export async function fetchTransactionsAdmin(): Promise<LedgerTransaction[]> {
  const res = await fetch(`${API_URL}/wallet/admin/transactions`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface DepositRequest {
  id: string;
  userId: string;
  email: string;
  zpAmount: number;
  depositorName: string;
  currency: 'VND' | 'KRW';
  refCode: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason: string | null;
  createdAt?: { _seconds: number } | null;
}

export async function submitDepositRequest(input: {
  zpAmount: number;
  depositorName: string;
  currency: 'VND' | 'KRW';
}): Promise<{ refCode: string }> {
  const res = await fetch(`${API_URL}/wallet/deposit`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchMyDeposits(): Promise<DepositRequest[]> {
  const res = await fetch(`${API_URL}/wallet/deposits`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function convertZpToExp(amount: number): Promise<{ success: boolean; convertedAmount: number }> {
  const res = await fetch(`${API_URL}/wallet/convert-zp-to-exp`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchAllDepositsAdmin(): Promise<DepositRequest[]> {
  const res = await fetch(`${API_URL}/wallet/admin/deposits`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function approveDepositAdmin(id: string) {
  const res = await fetch(`${API_URL}/wallet/admin/deposits/${id}/approve`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function rejectDepositAdmin(id: string, reason?: string) {
  const res = await fetch(`${API_URL}/wallet/admin/deposits/${id}/reject`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface BarrelHistoryEntry {
  date: string;
  ownerId: string;
  ownerAddress?: string;
  action: string;
  message?: string;
}

export interface BarrelDocument {
  id: string;
  userId: string;
  capacity: string;
  status: string;
  createdAt?: { _seconds: number } | null;
  productionDate?: { _seconds: number } | null;
  fillingDate?: { _seconds: number } | null;
  agingEndedAt?: { _seconds: number } | null;
  forSale?: boolean;
  currentValueZp: number;
  sealStatus: string;
  certNumber: string;
  qrKey: string;
  ownershipHistory: BarrelHistoryEntry[];
}

export interface PublicBarrel {
  id: string;
  capacity: string;
  status: string;
  sealStatus: string;
  certNumber: string;
  productionDate?: { _seconds: number } | null;
  agingEndedAt?: { _seconds: number } | null;
  forSale: boolean;
  currentValueZp: number;
  ownerLabel: string;
  ownerId: string;
}

export interface BarrelPricingConfig {
  baseUsdPerLiter: number;
  usdToZpRate: number;
  annualGrowthRate: number;
}

export async function submitBarrelOrder(size: string): Promise<{ success: boolean; barrelId: string; certNumber: string }> {
  const res = await fetch(`${API_URL}/token-exchange/barrel/order`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ size }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchMyBarrels(): Promise<BarrelDocument[]> {
  const res = await fetch(`${API_URL}/token-exchange/barrel/my`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function triggerBarrelAction(barrelId: string, action: string): Promise<{ success: boolean; nextStatus: string; nextSealStatus: string }> {
  const res = await fetch(`${API_URL}/token-exchange/barrel/action`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ barrelId, action }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchPublicBarrels(): Promise<PublicBarrel[]> {
  const res = await fetch(`${API_URL}/token-exchange/barrel/public`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function listBarrelForSale(barrelId: string): Promise<{ success: boolean; currentValueZp: number }> {
  const res = await fetch(`${API_URL}/token-exchange/barrel/${barrelId}/list-for-sale`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function cancelBarrelSale(barrelId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/token-exchange/barrel/${barrelId}/cancel-sale`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function buyBarrel(barrelId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/token-exchange/barrel/${barrelId}/buy`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function deleteBarrelAdmin(barrelId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/token-exchange/admin/barrel/${barrelId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchBarrelPricingConfig(): Promise<BarrelPricingConfig> {
  const res = await fetch(`${API_URL}/token-exchange/barrel-pricing-config`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function updateBarrelPricingConfigAdmin(
  patch: Partial<BarrelPricingConfig>,
): Promise<BarrelPricingConfig> {
  const res = await fetch(`${API_URL}/token-exchange/admin/barrel-pricing-config`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}
