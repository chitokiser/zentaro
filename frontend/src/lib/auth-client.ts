"use client";

import type { WebzinePost } from "@/lib/api";

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

export type WebzinePostDetailResult =
  | { status: "ok"; post: WebzinePost }
  | { status: "unauthorized" }
  | { status: "not_found" };

/** Members-only webzine post body, relayed through /api/webzine-post/[id] (see that route for why). */
export async function fetchWebzinePostDetail(id: string): Promise<WebzinePostDetailResult> {
  const token = getToken();
  const res = await fetch(`/api/webzine-post/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) return { status: "unauthorized" };
  if (!res.ok) return { status: "not_found" };
  return { status: "ok", post: await res.json() };
}

async function parseErrorMessage(res: Response): Promise<string> {
  if (res.status === 401 && !res.url.includes("/auth/login") && !res.url.includes("/auth/register")) {
    return "로그인이 필요합니다.";
  }
  try {
    const body = await res.json();
    return body.message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function register(email: string, password: string, displayName: string, referrerEmail?: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName, referrerEmail: referrerEmail || undefined }),
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

export async function loginWithGoogle(idToken: string, referrerEmail?: string) {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, referrerEmail: referrerEmail || undefined }),
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
  hasPaymentPassword: boolean;
  hasLoginPassword: boolean;
}

export async function fetchMe(): Promise<Me> {
  const res = await fetch(`${API_URL}/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function setPaymentPassword(pin: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/auth/payment-password`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function setLoginPassword(password: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/auth/password`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface Wallet {
  ap: number;
  exp: number;
  level: number;
  timeToken: number;
  jumpToken: number;
  rewardPoint: number;
  tickets: string[];
  nfts: string[];
  daoStakingAddress: string | null;
}

export async function fetchWallet(): Promise<Wallet> {
  const res = await fetch(`${API_URL}/wallet`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchDaoStakingLinkMessage(): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/wallet/dao-staking/link-message`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function linkDaoStakingAddress(address: string, signature: string): Promise<{ address: string }> {
  const res = await fetch(`${API_URL}/wallet/dao-staking/link-address`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ address, signature }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchDaoStakingBonusClaims(): Promise<number[]> {
  const res = await fetch(`${API_URL}/wallet/dao-staking/bonus-claims`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface DaoStakingBonusClaimResult {
  stakeId: number;
  bonus: number;
  months: number;
  level: number;
}

export interface DaoProposalNote {
  proposalId: number;
  purpose: string;
}

export async function fetchDaoProposalNotes(): Promise<DaoProposalNote[]> {
  const res = await fetch(`${API_URL}/wallet/dao-staking/proposal-notes`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function setDaoProposalNoteAdmin(proposalId: number, purpose: string): Promise<DaoProposalNote> {
  const res = await fetch(`${API_URL}/wallet/dao-staking/proposal-notes`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ proposalId, purpose }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function claimDaoStakingBonus(stakeId: number): Promise<DaoStakingBonusClaimResult> {
  const res = await fetch(`${API_URL}/wallet/dao-staking/claim-bonus`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ stakeId }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface LevelUpResult {
  level: number;
  exp: number;
  cost: number;
  nextLevelCost: number;
}

export async function levelUp(): Promise<LevelUpResult> {
  const res = await fetch(`${API_URL}/wallet/level-up`, {
    method: "POST",
    headers: authHeaders(),
  });
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
} export async function fetchZtroRewardPoolBalance(): Promise<{ balance: number }> {
  const res = await fetch(`${API_URL}/ztro-rewards/pool-balance`, {
    method: "GET",
    headers: { ...authHeaders() },
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
  qrDataUrl?: string | null;
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

export async function deleteUnusedZtroRewardCodes(): Promise<{ deleted: number }> {
  const res = await fetch(`${API_URL}/ztro-rewards/admin/unused`, {
    method: "DELETE",
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
  stakes?: Array<{
    stakeId: number;
    amount: number;
    lockedUntil: number;
    createdAt: number;
    active: boolean;
    unstaked: boolean;
    transferred: boolean;
  }>;
  withdrawApproved?: boolean;
  transferApproved?: boolean;
}

export async function fetchExchangeDashboard(): Promise<ExchangeDashboard> {
  const res = await fetch(`${API_URL}/token-exchange/dashboard`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchPancakePoolBalance(): Promise<{ balance: number }> {
  const res = await fetch(`${API_URL}/token-exchange/pancake-pool-balance`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface PublicMonthlyRevenue {
  totals: { orderCount: number; totalRevenueZp: number };
  byMonth: { month: string; orderCount: number; totalRevenueZp: number }[];
}

export async function fetchPublicMonthlyRevenue(): Promise<PublicMonthlyRevenue> {
  const res = await fetch(`${API_URL}/orders/public/monthly-revenue`);
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

export async function stakeZtro(amount: number, months: number = 3) {
  const res = await fetch(`${API_URL}/token-exchange/stake`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount, months }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function unstakeZtro(stakeId: number) {
  const res = await fetch(`${API_URL}/token-exchange/unstake`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ stakeId }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function transferOutZtro(stakeId: number, recipient: string, paymentPassword?: string) {
  const res = await fetch(`${API_URL}/token-exchange/transfer-out`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ stakeId, recipient, paymentPassword }),
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
  nameEn?: string | null;
  nameVi?: string | null;
  descriptionEn?: string | null;
  descriptionVi?: string | null;
  badges?: string[];
  badgesEn?: string[];
  badgesVi?: string[];
  priceAp: number;
  costAp?: number;
  stock?: number;
  priceZtaro?: number | null;
  fulfillmentType?: FulfillmentType;
  imageUrl: string | null;
  cjProductId?: string;
  featured: boolean;
  /** When true, hidden from public listings (auto-set when imageUrl is missing). */
  held?: boolean;
  supplierName?: string | null;
  supplierContact?: string | null;
  supplierCostKrw?: number | null;
  mentorRewardEnabled?: boolean;
  level1MentorRate?: number;
  level2MentorRate?: number;
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
  nameEn?: string;
  nameVi?: string;
  descriptionEn?: string;
  descriptionVi?: string;
  imageUrl?: string | null;
  badges?: string[];
  badgesEn?: string[];
  badgesVi?: string[];
  priceAp: number;
  costAp: number;
  stock?: number;
  supplierName?: string;
  supplierContact?: string;
  supplierCostKrw?: number;
  mentorRewardEnabled?: boolean;
  level1MentorRate?: number;
  level2MentorRate?: number;
  held?: boolean;
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
    nameEn: string;
    nameVi: string;
    descriptionEn: string;
    descriptionVi: string;
    imageUrl: string;
    badges: string[];
    badgesEn: string[];
    badgesVi: string[];
    priceAp: number;
    costAp: number;
    stock: number;
    supplierName: string;
    supplierContact: string;
    supplierCostKrw: number;
    mentorRewardEnabled: boolean;
    level1MentorRate: number;
    level2MentorRate: number;
    held: boolean;
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

export async function holdProductsMissingImagesAdmin(): Promise<{ held: number }> {
  const res = await fetch(`${API_URL}/products/admin/hold-missing-images`, {
    method: "POST",
    headers: authHeaders(),
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
  titleKo?: string | null;
  titleEn?: string | null;
  titleVi?: string | null;
  contentHtmlKo?: string | null;
  contentHtmlEn?: string | null;
  contentHtmlVi?: string | null;
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
  titleKo?: string;
  titleEn?: string;
  titleVi?: string;
  contentHtmlKo?: string;
  contentHtmlEn?: string;
  contentHtmlVi?: string;
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
    titleKo: string;
    titleEn: string;
    titleVi: string;
    contentHtmlKo: string;
    contentHtmlEn: string;
    contentHtmlVi: string;
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

export interface MentorInfo {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface ReferredMember {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt?: { _seconds: number } | null;
}

export interface ReferredPurchase {
  id: string;
  amount: number;
  description: string;
  referredUserEmail: string | null;
  referredUserId: string | null;
  purchaseAmountAp: number;
  rewardLevel: number;
  createdAt?: { _seconds: number } | null;
}

export interface MentorDashboard {
  referrer: MentorInfo | null;
  referredMembers: ReferredMember[];
  totalEarnedExp: number;
  referredPurchases?: ReferredPurchase[];
}

export async function fetchMentorDashboard(): Promise<MentorDashboard> {
  const res = await fetch(`${API_URL}/auth/mentor-dashboard`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface CheckoutOrderItem {
  productId: string;
  quantity: number;
  productName: string;
  fulfillmentType?: FulfillmentType;
  priceAp?: number;
  costAp?: number;
  apPaid?: number;
  expPaid?: number;
  /** Only present on ZTARO-paid (명품관) order lines. */
  priceZtaro?: number;
}

export interface AdminOrder {
  id: string;
  userId: string;
  items: CheckoutOrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod?: "zp" | "ztaro";
  totalPriceAp?: number;
  totalCostAp?: number;
  totalApPaid?: number;
  totalExpPaid?: number;
  totalPriceZtaro?: number;
  ztaroTxHash?: string;
  /** EXP applied on top of a ZTARO-paid order (extra discount for ZTARO holders). */
  expUsed?: number;
  status: "pending_payment" | "paid" | "preparing" | "shipped" | "delivered" | "cancelled";
  createdAt?: { _seconds: number } | null;
}

export async function checkoutCart(input: {
  items: Array<{ productId: string; quantity: number }>;
  expToUse?: number;
  shippingAddress: ShippingAddress;
  saveAddress?: boolean;
  paymentMethod?: "zp" | "ztaro";
}) {
  const res = await fetch(`${API_URL}/orders/checkout`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json() as Promise<{
    orderId: string;
    totalApPaid?: number;
    totalExpPaid?: number;
    remainingAp?: number;
    remainingExp?: number;
    totalPriceZtaro?: number;
    txHash?: string;
  }>;
}

export interface ZtaroPricingConfig {
  discountRate: number;
  zpPerZtaro: number;
  /** Minimum active vault-staked ZTARO required to pay with ZTARO at checkout. */
  minStakeZtaro: number;
  /** Minimum member level (1-10) required to pay with ZTARO at checkout. */
  minLevel: number;
}

export async function fetchZtaroPricingConfig(): Promise<ZtaroPricingConfig> {
  const res = await fetch(`${API_URL}/products/ztaro-pricing-config`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function updateZtaroDiscountAdmin(discountPercent: number): Promise<ZtaroPricingConfig> {
  const res = await fetch(`${API_URL}/products/admin/ztaro-pricing-config`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ discountPercent }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function updateZtaroEligibilityAdmin(patch: {
  minStakeZtaro?: number;
  minLevel?: number;
}): Promise<ZtaroPricingConfig> {
  const res = await fetch(`${API_URL}/products/admin/ztaro-eligibility-config`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
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
  zentaroProduct: "origin" | "blue" | null;
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
  zentaroProduct?: "origin" | "blue";
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
  currency: 'VND' | 'KRW' | 'USDT';
  usdtAmount?: number;
  txHash?: string;
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

export async function depositUsdt(): Promise<{ success: boolean; usdtAmount: number; zpCredited: number; txHash: string }> {
  const res = await fetch(`${API_URL}/wallet/deposit-usdt`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function withdrawUsdt(zpAmount: number, paymentPassword?: string): Promise<{
  success: boolean;
  zpDeducted: number;
  grossUsdt: number;
  feeUsdt: number;
  netUsdt: number;
  txHash: string;
}> {
  const res = await fetch(`${API_URL}/wallet/withdraw-usdt`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ zpAmount, paymentPassword }),
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

export async function transferZp(toEmail: string, zpAmount: number, paymentPassword?: string): Promise<{
  toEmail: string;
  zpAmount: number;
  fee: number;
  netAmount: number;
}> {
  const res = await fetch(`${API_URL}/wallet/transfer-zp`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ toEmail, zpAmount, paymentPassword }),
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

export interface BarrelFinishing {
  id: string;
  days: number;
  requestedAt: string;
  startedAt: string | null;
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
  currentValueZtro: number;
  sealStatus: string;
  certNumber: string;
  qrKey: string;
  charLevel?: string;
  agingEnvironment?: string;
  enhancements?: string[];
  finishing?: BarrelFinishing | null;
  blendMasterScore?: number | null;
  blendMasterComment?: string | null;
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
  currentValueZtro: number;
  customAnnualGrowthRate: number | null;
  charLevel?: string;
  agingEnvironment?: string;
  enhancements?: string[];
  finishing?: BarrelFinishing | null;
  blendMasterScore?: number | null;
  blendMasterComment?: string | null;
  ownerLabel: string;
  ownerId: string;
}

export interface BarrelPricingConfig {
  baseUsdPerLiter: number;
  usdToZpRate: number;
  annualGrowthRate: number;
  pricePerLiterExp: number;
  pricePerLiterZp: number;
}

export async function submitBarrelOrder(
  size: string,
  agingEnvironment?: string,
  paymentMethod?: "exp" | "zp" | "ztaro",
): Promise<{ success: boolean; barrelId: string; certNumber: string; paymentMethod: "exp" | "zp" | "ztaro"; paidAmount: number; txHash?: string }> {
  const res = await fetch(`${API_URL}/token-exchange/barrel/order`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ size, agingEnvironment, paymentMethod }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function addBarrelEnhancement(barrelId: string, enhancementId: string): Promise<{ success: boolean; currentValueZp: number }> {
  const res = await fetch(`${API_URL}/token-exchange/barrel/${barrelId}/enhancement`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ enhancementId }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function applyBarrelFinishing(barrelId: string, finishId: string, days: number): Promise<{ success: boolean; currentValueZp: number }> {
  const res = await fetch(`${API_URL}/token-exchange/barrel/${barrelId}/finishing`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ finishId, days }),
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
  const token = getToken();
  const validToken = (token && token !== "undefined" && token !== "null") ? token : null;
  const headers: HeadersInit = validToken ? { Authorization: `Bearer ${validToken}` } : {};
  const res = await fetch(`${API_URL}/token-exchange/barrel/public`, { headers });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function listBarrelForSale(barrelId: string): Promise<{ success: boolean; currentValueZtro: number }> {
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

export async function buyBarrel(barrelId: string, paymentPassword?: string): Promise<{ success: boolean; priceZtro: number; feeZtro: number; txHash: string }> {
  const res = await fetch(`${API_URL}/token-exchange/barrel/${barrelId}/buy`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ paymentPassword }),
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
  const token = getToken();
  const validToken = (token && token !== "undefined" && token !== "null") ? token : null;
  const headers: HeadersInit = validToken ? { Authorization: `Bearer ${validToken}` } : {};
  const res = await fetch(`${API_URL}/token-exchange/barrel-pricing-config`, { headers });
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

export async function updateBarrelGrowthRateAdmin(
  barrelId: string,
  annualGrowthRate: number | null,
): Promise<{ success: boolean; barrelId: string; customAnnualGrowthRate: number | null; currentValueZp: number }> {
  const res = await fetch(`${API_URL}/token-exchange/admin/barrel/${barrelId}/growth-rate`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ annualGrowthRate }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function startBarrelFinishingAdmin(barrelId: string): Promise<{ success: boolean; barrelId: string; finishing: BarrelFinishing }> {
  const res = await fetch(`${API_URL}/token-exchange/admin/barrel/${barrelId}/finishing/start`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function setBarrelEvaluationAdmin(
  barrelId: string,
  score: number,
  comment?: string,
  breakdown?: { aroma?: number; palate?: number; finish?: number; barrelQuality?: number },
): Promise<{
  success: boolean;
  barrelId: string;
  blendMasterScore: number;
  blendMasterComment: string | null;
  customAnnualGrowthRate: number;
  currentValueZp: number;
}> {
  const res = await fetch(`${API_URL}/token-exchange/admin/barrel/${barrelId}/evaluation`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ score, comment, ...breakdown }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  email: string;
  rating: number;
  comment: string;
  createdAt?: { _seconds: number } | null;
}

export async function fetchProductReviews(
  productId: string,
): Promise<{ reviews: ProductReview[]; average: number; count: number }> {
  const res = await fetch(`${API_URL}/product-reviews?productId=${encodeURIComponent(productId)}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function submitProductReview(productId: string, rating: number, comment: string): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/product-reviews`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ productId, rating, comment }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function deleteProductReview(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/product-reviews/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface InvestorWatch {
  id: string;
  address: string;
  label: string;
  grantDate: { _seconds: number } | null;
  grantAmount: number | null;
  sellThreshold: number;
  lastKnownBalance: number | null;
  cumulativeDecrease: number;
  alertTriggered: boolean;
  alertTriggeredAt: { _seconds: number } | null;
  alertAcknowledgedAt: { _seconds: number } | null;
  costBasisQty: number;
  avgCostUsdt: number;
  totalBoughtZtaro: number;
  totalBuyCostUsdt: number;
  totalSoldZtaro: number;
  totalSellProceedsUsdt: number;
  realizedProfitUsdt: number;
  swapSyncedAt: { _seconds: number } | null;
  swapSyncError: string | null;
}

export async function fetchInvestorWatchList(): Promise<InvestorWatch[]> {
  const res = await fetch(`${API_URL}/investor-watch`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function createInvestorWatch(input: {
  address: string;
  label: string;
  grantDate: string;
  grantAmount?: number;
  sellThreshold: number;
}): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/investor-watch`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function deleteInvestorWatch(id: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/investor-watch/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function acknowledgeInvestorWatch(id: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/investor-watch/${id}/acknowledge`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function syncInvestorWatch(id: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/investor-watch/${id}/sync`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchInvestorWatchAlertCount(): Promise<{ count: number }> {
  const res = await fetch(`${API_URL}/investor-watch/alerts/count`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

// ---------------------------------------------------------------------------
// Global Drinks Database
// ---------------------------------------------------------------------------

export interface DrinkExternalRating {
  source: string;
  rating: number;
  ratingCount: number;
}

export interface DrinkProduct {
  id: string;
  source: string;
  name: string;
  slug: string;
  category: string;
  subCategory: string | null;
  country: string | null;
  region: string | null;
  producerName: string | null;
  abv: number | null;
  age: number | null;
  description: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  sourceLicense: string | null;
  externalRatings: DrinkExternalRating[];
  zentaroRating: number | null;
  zentaroRatingCount: number;
  weightedRating: number | null;
  isZentaroProduct: boolean;
  mergeCandidateOf?: string | null;
  taste?: string[];
  foodPairing?: string[];
}

export interface DrinkCocktail {
  id: string;
  name: string;
  category: string | null;
  alcoholic: string | null;
  glass: string | null;
  instructions: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  tags: string[];
  ingredients: { name: string; measure: string | null }[];
}

export interface DrinkIngredient {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  description: string | null;
  alcoholic: boolean;
  abv: number | null;
  isBotanical: boolean;
  botanicalCategory: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  sourceLicense: string | null;
}

export interface DrinkSearchResult {
  products: DrinkProduct[];
  cocktails: DrinkCocktail[];
  ingredients: DrinkIngredient[];
}

export interface DrinkStatistics {
  totalProducts: number;
  totalCountries: number;
  totalProducers: number;
  totalIngredients: number;
  totalBotanicals: number;
  totalCocktails: number;
  newProductsThisMonth: number;
  lastUpdated: string | null;
}

export async function searchDrinks(
  q: string,
  filters: { category?: string; country?: string; minAbv?: number; maxAbv?: number } = {},
): Promise<DrinkSearchResult> {
  const params = new URLSearchParams({ q });
  if (filters.category) params.set("category", filters.category);
  if (filters.country) params.set("country", filters.country);
  if (filters.minAbv != null) params.set("minAbv", String(filters.minAbv));
  if (filters.maxAbv != null) params.set("maxAbv", String(filters.maxAbv));
  const res = await fetch(`${API_URL}/drinks/search?${params.toString()}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchDrinkBySlug(slug: string): Promise<{ product: DrinkProduct; relatedCocktails: DrinkCocktail[] }> {
  const res = await fetch(`${API_URL}/drinks/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchDrinkRankings(tab: string, category?: string): Promise<DrinkProduct[]> {
  const params = new URLSearchParams({ tab });
  if (category) params.set("category", category);
  const res = await fetch(`${API_URL}/drinks/rankings?${params.toString()}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchDrinksByCountry(country: string): Promise<DrinkProduct[]> {
  const res = await fetch(`${API_URL}/drinks/country/${encodeURIComponent(country)}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchDrinkStatistics(): Promise<DrinkStatistics> {
  const res = await fetch(`${API_URL}/drinks/statistics`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface DrinkCountryCount {
  country: string;
  count: number;
}

export async function fetchDrinkCountries(): Promise<DrinkCountryCount[]> {
  const res = await fetch(`${API_URL}/drinks/countries`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchZentaroOriginals(): Promise<DrinkProduct[]> {
  const res = await fetch(`${API_URL}/drinks/zentaro-originals`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchCocktailById(id: string): Promise<DrinkCocktail> {
  const res = await fetch(`${API_URL}/drinks/cocktails/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchBotanicals(botanicalOnly?: boolean): Promise<DrinkIngredient[]> {
  const params = botanicalOnly ? "?botanicalOnly=true" : "";
  const res = await fetch(`${API_URL}/botanicals${params}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchBotanicalBySlug(
  slug: string,
): Promise<{ ingredient: DrinkIngredient; relatedCocktails: DrinkCocktail[] }> {
  const res = await fetch(`${API_URL}/botanicals/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function rateDrinkProduct(slug: string, rating: number): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/drinks/${encodeURIComponent(slug)}/rate`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ rating }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface DrinkSyncLog {
  id: string;
  source: string;
  newRecords: number;
  updatedRecords: number;
  errors: string[];
  startedAt?: { _seconds: number } | null;
  completedAt?: { _seconds: number } | null;
}

export async function syncDrinksNow(): Promise<unknown> {
  const res = await fetch(`${API_URL}/drinks/admin/sync-now`, { method: "POST", headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchDrinkSyncLogs(): Promise<DrinkSyncLog[]> {
  const res = await fetch(`${API_URL}/drinks/admin/sync-logs`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface Beer9Status {
  sourceName: string;
  sourceUrl: string | null;
  license: string;
  lastSyncedAt?: { _seconds: number } | null;
  oneTimeSyncCompletedAt?: { _seconds: number } | null;
  lastRunProductsFetched?: number;
  lastRunPagesFetched?: number;
  lastRunStoppedReason?: string;
}

export async function fetchBeer9Status(): Promise<Beer9Status | null> {
  const res = await fetch(`${API_URL}/drinks/admin/beer9-status`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function syncBeer9Once(
  maxPages?: number,
  force?: boolean,
): Promise<{ newRecords: number; updatedRecords: number; errors: string[]; pagesFetched: number; stoppedReason: string }> {
  const res = await fetch(`${API_URL}/drinks/admin/sync-beer9-once`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ maxPages, force }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchDrinkMergeCandidates(): Promise<DrinkProduct[]> {
  const res = await fetch(`${API_URL}/drinks/admin/merge-candidates`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchRankingConfig(): Promise<{ minReviews: number }> {
  const res = await fetch(`${API_URL}/drinks/admin/ranking-config`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function updateRankingConfig(minReviews: number): Promise<{ minReviews: number }> {
  const res = await fetch(`${API_URL}/drinks/admin/ranking-config`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ minReviews }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function recalcDrinkRankings(): Promise<{ updated: number }> {
  const res = await fetch(`${API_URL}/drinks/admin/recalculate-rankings`, { method: "POST", headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function createBotanicalAdmin(input: {
  name: string;
  description?: string;
  isBotanical: boolean;
  botanicalCategory?: string;
}): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/botanicals/admin`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function deleteBotanicalAdmin(id: string): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/botanicals/admin/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function setZentaroFlagAdmin(
  slug: string,
  isZentaroProduct: boolean,
): Promise<{ id: string; isZentaroProduct: boolean }> {
  const res = await fetch(`${API_URL}/drinks/admin/${encodeURIComponent(slug)}/zentaro-flag`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ isZentaroProduct }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

// ---------------------------------------------------------------------------
// ZENTARO Whisky Market — Whisky Hunter (whiskyhunter.net) market analytics.
// Whisky Hunter only ever provides MONTHLY AGGREGATE stats per distillery/auction
// house (mean/min/max winning bid, trading volume, lots count) — there is no
// live-lot, current-bid, or bottle-level data, so none of these types claim any.
// ---------------------------------------------------------------------------

export interface WhiskyDistillery {
  name: string;
  slug: string;
  country: string;
}

export interface WhiskyDistilleryDataPoint {
  dt: string;
  winning_bid_max: number;
  winning_bid_min: number;
  winning_bid_mean: number;
  trading_volume: number;
  lots_count: number;
}

export interface WhiskyDistilleryDetail extends WhiskyDistillery {
  history?: WhiskyDistilleryDataPoint[];
}

export interface WhiskyAuctionHouse {
  name: string;
  slug: string;
  url: string;
  buyersFee: number;
  sellersFee: number;
  reserveFee: number;
  listingFee: number;
  baseCurrency: string;
}

export interface WhiskyAuctionDataPoint {
  dt: string;
  winning_bid_mean: number;
  auction_trading_volume: number;
  auction_lots_count: number;
}

export interface WhiskyAuctionHouseDetail extends WhiskyAuctionHouse {
  history?: WhiskyAuctionDataPoint[];
}

export interface WhiskyMarketTrendPoint {
  dt: string;
  totalTradingVolume: number;
  totalLots: number;
  weightedMeanBid: number;
}

export interface WhiskyMarketDashboard {
  totalDistilleries: number;
  totalAuctionHouses: number;
  lastDataDate: string | null;
  trend: WhiskyMarketTrendPoint[];
  source: string;
}

export async function fetchWhiskyDashboard(): Promise<WhiskyMarketDashboard> {
  const res = await fetch(`${API_URL}/whisky-market/dashboard`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchWhiskyDistilleries(filters: { country?: string; q?: string } = {}): Promise<WhiskyDistillery[]> {
  const params = new URLSearchParams();
  if (filters.country) params.set("country", filters.country);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  const res = await fetch(`${API_URL}/whisky-market/distilleries${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchWhiskyDistillery(slug: string): Promise<WhiskyDistilleryDetail> {
  const res = await fetch(`${API_URL}/whisky-market/distilleries/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchWhiskyAuctionHouses(): Promise<WhiskyAuctionHouse[]> {
  const res = await fetch(`${API_URL}/whisky-market/auction-houses`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchWhiskyAuctionHouse(slug: string): Promise<WhiskyAuctionHouseDetail> {
  const res = await fetch(`${API_URL}/whisky-market/auction-houses/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface WhiskyWatchItem {
  id: string;
  distillerySlug: string;
  distilleryName: string;
  country: string | null;
}

export async function fetchWhiskyWatchlist(): Promise<WhiskyWatchItem[]> {
  const res = await fetch(`${API_URL}/whisky-market/watchlist`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function addWhiskyWatch(distillerySlug: string): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/whisky-market/watchlist`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ distillerySlug }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function removeWhiskyWatch(distillerySlug: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/whisky-market/watchlist/${encodeURIComponent(distillerySlug)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface WhiskyTarget {
  id: string;
  distillerySlug: string;
  distilleryName: string;
  targetPrice: number;
  notificationOn: boolean;
  latestAvgPrice: number | null;
  latestAvgDt: string | null;
  status: "WITHIN_TARGET" | "OVER_TARGET" | "NO_DATA";
}

export async function fetchWhiskyTargets(): Promise<WhiskyTarget[]> {
  const res = await fetch(`${API_URL}/whisky-market/targets`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function setWhiskyTarget(
  distillerySlug: string,
  targetPrice: number,
  notificationOn?: boolean,
): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/whisky-market/targets`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ distillerySlug, targetPrice, notificationOn }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function removeWhiskyTarget(distillerySlug: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/whisky-market/targets/${encodeURIComponent(distillerySlug)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

// --- Producer / Distillery directory (Open Brewery DB + Wikidata) ---

export interface DrinkProducer {
  id: string;
  source: "openbrewerydb" | "wikidata";
  externalId: string;
  name: string;
  slug: string;
  producerType: "brewery" | "distillery";
  country: string | null;
  region: string | null;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  website: string | null;
  foundedYear: number | null;
  description: string | null;
  sourceUrl: string | null;
  sourceLicense: string;
}

export async function fetchDrinkProducers(filters?: {
  producerType?: string;
  country?: string;
  q?: string;
}): Promise<DrinkProducer[]> {
  const params = new URLSearchParams();
  if (filters?.producerType) params.set("type", filters.producerType);
  if (filters?.country) params.set("country", filters.country);
  if (filters?.q) params.set("q", filters.q);
  const qs = params.toString();
  const res = await fetch(`${API_URL}/drinks/producers${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchDrinkProducerCountries(): Promise<DrinkCountryCount[]> {
  const res = await fetch(`${API_URL}/drinks/producers/countries`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchDrinkProducer(
  slug: string,
): Promise<{ producer: DrinkProducer; relatedProducts: DrinkProduct[] }> {
  const res = await fetch(`${API_URL}/drinks/producers/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface ProducersSyncStatus {
  sourceName: string;
  license: string;
  lastSyncedAt?: { _seconds: number } | null;
  oneTimeSyncCompletedAt?: { _seconds: number } | null;
  lastRunNewRecords?: number;
  lastRunUpdatedRecords?: number;
  lastRunErrorCount?: number;
}

export async function fetchProducersSyncStatus(): Promise<ProducersSyncStatus | null> {
  const res = await fetch(`${API_URL}/drinks/admin/producers-status`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function syncProducersOnce(
  maxPagesOpenBreweryDb?: number,
  maxItemsPerWikidataType?: number,
  force?: boolean,
): Promise<{
  newRecords: number;
  updatedRecords: number;
  errors: string[];
  openBreweryDbPagesFetched: number;
  openBreweryDbStoppedReason: string;
  wikidataBreweriesFetched: number;
  wikidataDistilleriesFetched: number;
}> {
  const res = await fetch(`${API_URL}/drinks/admin/sync-producers-once`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ maxPagesOpenBreweryDb, maxItemsPerWikidataType, force }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface FoodPairing {
  id: string;
  productSlug: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  totalTimeMinutes: number | null;
  servings: number | null;
  ratingScore: number | null;
  tags: string[];
  sourceUrl: string;
  sourceLicense: string;
}

export async function fetchFoodPairings(productSlug: string): Promise<FoodPairing[]> {
  const res = await fetch(`${API_URL}/drinks/food-pairings/${encodeURIComponent(productSlug)}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface FoodPairingsSyncStatus {
  sourceName: string;
  license: string;
  lastSyncedAt?: { _seconds: number } | null;
  oneTimeSyncCompletedAt?: { _seconds: number } | null;
  lastRunNewRecords?: number;
  lastRunUpdatedRecords?: number;
  lastRunErrorCount?: number;
}

export async function fetchFoodPairingsSyncStatus(): Promise<FoodPairingsSyncStatus | null> {
  const res = await fetch(`${API_URL}/drinks/admin/food-pairings-status`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function syncFoodPairingsOnce(
  recipesPerProduct?: number,
  force?: boolean,
): Promise<{ newRecords: number; updatedRecords: number; errors: string[] }> {
  const res = await fetch(`${API_URL}/drinks/admin/sync-food-pairings-once`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ recipesPerProduct, force }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface ProductDnaScores {
  botanical: number;
  sweetness: number;
  aroma: number;
  smoothness: number;
  purity: number;
}

export async function fetchProductDnaOverrides(): Promise<Record<string, ProductDnaScores>> {
  const res = await fetch(`${API_URL}/product-dna`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function updateProductDna(slug: string, scores: ProductDnaScores): Promise<ProductDnaScores> {
  const res = await fetch(`${API_URL}/product-dna/${encodeURIComponent(slug)}`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(scores),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

/** Real TheCocktailDB cocktails whose ingredient list contains this exact ingredient name (e.g. "gin"). */
export async function fetchCocktailsByIngredient(name: string): Promise<DrinkCocktail[]> {
  const res = await fetch(`${API_URL}/drinks/cocktails/by-ingredient/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export interface AiCocktailRecipe {
  name: string;
  tagline: string;
  ingredients: { name: string; amount: string }[];
  instructions: string[];
  glassware: string;
  garnish: string | null;
}

export interface GenerateCocktailInput {
  productName: string;
  productCategory: string;
  productDescription: string;
  abv?: string;
  flavorHint?: string;
  locale: "ko" | "en" | "vi";
}

/** AI-generated ORIGINAL cocktail recipe — not a lookup against an existing published cocktail. */
export async function generateAiCocktail(input: GenerateCocktailInput): Promise<AiCocktailRecipe> {
  const res = await fetch(`${API_URL}/ai-cocktail/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

// ---------- AI Virtual Research Lab (Flavor DNA prediction) ----------

export interface FlavorLabBotanicalScores {
  floral: number; fruity: number; citrus: number; herbal: number; spicy: number;
  woody: number; earthy: number; vanilla: number; roasted: number;
  sweet: number; sour: number; bitter: number; umami: number; salty: number; astringency: number;
  body: number; dryness: number; finish: number;
}

export interface FlavorLabBotanical {
  id: string;
  name: string;
  localName?: string;
  origin?: string;
  plantPart?: string;
  topAroma: string[];
  midAroma: string[];
  baseAroma: string[];
  scores: FlavorLabBotanicalScores;
  colorEffect?: string;
  aromaIntensity: number;
  flavorIntensity: number;
  recommendedDoseMin: number;
  recommendedDoseMax: number;
  recommendedAbv?: number;
  extractionMethod: string;
  extractionTimeHours: number;
  extractionTemperatureC: number;
  distillationBehavior: string;
  notes?: string;
}

export interface FlavorLabProject {
  id: string;
  projectName: string;
  accentColor?: string;
  baseSpirit: string;
  baseAbv: number;
  targetAbv: number;
  baseVolumeMl: number;
  extractionMethod: string;
  extractionTimeHours: number;
  extractionTemperatureC: number;
  botanicals: { botanicalId: string; doseGrams: number }[];
  version: string;
}

export interface FlavorDna {
  aroma: Record<"floral" | "fruity" | "citrus" | "herbal" | "spicy" | "woody" | "earthy" | "vanilla" | "roasted", number>;
  taste: Record<"sweet" | "sour" | "bitter" | "umami" | "salty" | "astringency", number>;
  mouthfeel: { light: number; body: number; warmth: number; smoothness: number; dryness: number };
  finish: { short: number; medium: number; long: number; dry: number; sweet: number; spicy: number };
}

export interface FlavorLabNarrative {
  nose: string;
  attack: string;
  midPalate: string;
  finish: string;
  strengths: string[];
  risks: string[];
  recommendation: string;
}

export interface FlavorLabAnalyzeResult {
  project: FlavorLabProject;
  botanicals: (FlavorLabBotanical & { doseGrams: number })[];
  flavorDna: FlavorDna;
  narrative: FlavorLabNarrative | null;
}

export async function fetchFlavorLabProjects(): Promise<FlavorLabProject[]> {
  const res = await fetch(`${API_URL}/flavor-lab/projects`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function fetchFlavorLabBotanicals(): Promise<FlavorLabBotanical[]> {
  const res = await fetch(`${API_URL}/flavor-lab/botanicals`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function analyzeFlavorLabProject(
  id: string,
  locale: "ko" | "en" | "vi",
): Promise<FlavorLabAnalyzeResult> {
  const res = await fetch(`${API_URL}/flavor-lab/projects/${id}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale }),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}
