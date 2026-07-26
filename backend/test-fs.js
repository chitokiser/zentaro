require('dotenv').config();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

console.log("Loading environment variables...");
console.log("PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);

try {
    console.log("Initializing Firebase app...");
    const app = initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
        }),
    });
    console.log("App initialized successfully.");

    console.log("Getting Firestore database instance...");
    const db = getFirestore(app);
    console.log("Firestore instance obtained.");

    console.log("Attempting a simple dry-run query (users collection limit 1)...");

    // Set a timeout of 10 seconds to abort if it hangs
    const timer = setTimeout(() => {
        console.error("TIMEOUT exceeded! Firestore query is hanging/offline.");
        process.exit(1);
    }, 10000);

    db.collection('users').limit(1).get().then(snap => {
        clearTimeout(timer);
        console.log("Query complete! Results empty?:", snap.empty);
        process.exit(0);
    }).catch(err => {
        clearTimeout(timer);
        console.error("Query failed with error:", err);
        process.exit(1);
    });
} catch (e) {
    console.error("Exception during setup:", e);
    process.exit(1);
}
