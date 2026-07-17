import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

export const FIRESTORE = 'FIRESTORE';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: FIRESTORE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Firestore => {
        const existing: App[] = getApps();
        const app =
          existing[0] ??
          initializeApp({
            credential: cert({
              projectId: config.get<string>('FIREBASE_PROJECT_ID'),
              clientEmail: config.get<string>('FIREBASE_CLIENT_EMAIL'),
              privateKey: config
                .get<string>('FIREBASE_PRIVATE_KEY', '')
                .replace(/\\n/g, '\n'),
            }),
            storageBucket: config.get<string>('FIREBASE_STORAGE_BUCKET'),
          });
        return getFirestore(app);
      },
    },
  ],
  exports: [FIRESTORE],
})
export class FirebaseModule {}
