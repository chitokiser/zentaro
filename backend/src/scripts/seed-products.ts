import { config } from 'dotenv';
config();

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '../common/collections';

const SAMPLE_PRODUCTS = [
  { name: 'ZENTARO Dry Gin', category: 'Dry Gin', priceAp: 45000 },
  { name: 'Strawberry Liqueur', category: 'Liqueur', priceAp: 38000 },
  { name: 'ZENTARO Whisky', category: 'Whisky', priceAp: 72000 },
  { name: 'Herb Salt', category: 'Herb Food', priceAp: 9000 },
  { name: 'Herb Pepper', category: 'Herb Food', priceAp: 9000 },
  { name: 'Herb Cheese', category: 'Herb Deli', priceAp: 15000 },
  { name: 'Herb Ham', category: 'Herb Deli', priceAp: 22000 },
  { name: 'Herb Salami', category: 'Herb Deli', priceAp: 24000 },
  { name: 'Herb Soap', category: 'Herb Cosmetics', priceAp: 12000 },
  { name: 'Herb Shampoo', category: 'Herb Cosmetics', priceAp: 18000 },
];

async function main() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
      }),
    });
  }
  const db = getFirestore();
  const col = db.collection(COLLECTIONS.ZENTARO_PRODUCTS);

  for (const product of SAMPLE_PRODUCTS) {
    const existing = await col.where('name', '==', product.name).limit(1).get();
    if (!existing.empty) {
      console.log(`skip (exists): ${product.name}`);
      continue;
    }
    await col.add({
      ...product,
      featured: true,
      imageUrl: null,
      description: `${product.name} — ZENTARO premium craft distillery product.`,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`seeded: ${product.name}`);
  }

  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
