import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';

function generateCode(): string {
  return randomBytes(5).toString('hex').toUpperCase();
}

@Injectable()
export class TicketsService {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  async issue(source: string, count: number) {
    const batch = this.db.batch();
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      let code = generateCode();
      codes.push(code);
      const ref = this.db.collection(COLLECTIONS.ZENTARO_TICKETS).doc(code);
      batch.set(ref, {
        code,
        ownerId: null,
        status: 'unused',
        source,
        createdAt: FieldValue.serverTimestamp(),
        registeredAt: null,
        usedAt: null,
        transferHistory: [],
      });
    }
    await batch.commit();
    return { issued: codes.length, codes };
  }

  async register(uid: string, code: string) {
    const ticketRef = this.db
      .collection(COLLECTIONS.ZENTARO_TICKETS)
      .doc(code.toUpperCase());
    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);

    return this.db.runTransaction(async (tx) => {
      const ticketSnap = await tx.get(ticketRef);
      if (!ticketSnap.exists) {
        throw new NotFoundException('Invalid ticket code');
      }
      const ticket = ticketSnap.data()!;
      if (ticket.ownerId) {
        throw new BadRequestException('Ticket already registered');
      }

      tx.update(ticketRef, {
        ownerId: uid,
        status: 'unused',
        registeredAt: FieldValue.serverTimestamp(),
      });
      tx.set(
        walletRef,
        { tickets: FieldValue.arrayUnion(code.toUpperCase()) },
        { merge: true },
      );

      return { code: code.toUpperCase() };
    });
  }

  async listMine(uid: string) {
    const snap = await this.db
      .collection(COLLECTIONS.ZENTARO_TICKETS)
      .where('ownerId', '==', uid)
      .get();
    return snap.docs.map((doc) => doc.data());
  }

  async use(uid: string, code: string) {
    const ticketRef = this.db
      .collection(COLLECTIONS.ZENTARO_TICKETS)
      .doc(code.toUpperCase());

    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ticketRef);
      if (!snap.exists) throw new NotFoundException('Invalid ticket code');
      const ticket = snap.data()!;
      if (ticket.ownerId !== uid) {
        throw new ForbiddenException('You do not own this ticket');
      }
      if (ticket.status === 'used') {
        throw new BadRequestException('Ticket already used');
      }
      tx.update(ticketRef, { status: 'used', usedAt: FieldValue.serverTimestamp() });
      return { code: code.toUpperCase(), status: 'used' };
    });
  }

  async transfer(fromUid: string, code: string, toEmail: string) {
    const usersCol = this.db.collection(COLLECTIONS.USERS);
    const toSnap = await usersCol.where('email', '==', toEmail).limit(1).get();
    if (toSnap.empty) {
      throw new NotFoundException('Recipient not found');
    }
    const toUid = toSnap.docs[0].id;
    if (toUid === fromUid) {
      throw new BadRequestException('Cannot transfer a ticket to yourself');
    }

    const ticketRef = this.db
      .collection(COLLECTIONS.ZENTARO_TICKETS)
      .doc(code.toUpperCase());
    const fromWalletRef = this.db
      .collection(COLLECTIONS.ZENTARO_WALLETS)
      .doc(fromUid);
    const toWalletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(toUid);

    return this.db.runTransaction(async (tx) => {
      const ticketSnap = await tx.get(ticketRef);
      if (!ticketSnap.exists) throw new NotFoundException('Invalid ticket code');
      const ticket = ticketSnap.data()!;
      if (ticket.ownerId !== fromUid) {
        throw new ForbiddenException('You do not own this ticket');
      }
      if (ticket.status === 'used') {
        throw new BadRequestException('Used tickets cannot be transferred');
      }

      tx.update(ticketRef, {
        ownerId: toUid,
        transferHistory: FieldValue.arrayUnion({
          from: fromUid,
          to: toUid,
          at: new Date().toISOString(),
        }),
      });
      tx.set(
        fromWalletRef,
        { tickets: FieldValue.arrayRemove(code.toUpperCase()) },
        { merge: true },
      );
      tx.set(
        toWalletRef,
        { tickets: FieldValue.arrayUnion(code.toUpperCase()) },
        { merge: true },
      );

      return { code: code.toUpperCase(), transferredTo: toEmail };
    });
  }
}
