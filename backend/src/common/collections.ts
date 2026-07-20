/**
 * Firestore collection names for the shared "aim119" project.
 * USERS / TRANSACTIONS are shared across every aim119 app (AP points economy).
 * ZENTARO_* collections are namespaced so this app never collides with other bots.
 */
export const COLLECTIONS = {
  USERS: 'users',
  TRANSACTIONS: 'transactions',
  ROULETTE_SPINS: 'roulette_spins',
  ZENTARO_WALLETS: 'zentaro_wallets',
  ZENTARO_PRODUCTS: 'zentaro_products',
  ZENTARO_ORDERS: 'zentaro_orders',
  ZENTARO_TICKETS: 'zentaro_tickets',
  ZENTARO_NFTS: 'zentaro_nfts',
  ZENTARO_CONTRIBUTIONS: 'zentaro_contributions',
  ZENTARO_POSTS: 'zentaro_posts',
  ZENTARO_VENDOR_INQUIRIES: 'zentaro_vendor_inquiries',
  ZENTARO_BOTTLE_CAP_CLAIMS: 'zentaro_bottle_cap_claims',
} as const;
