import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import * as QRCode from 'qrcode';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { WalletService } from '../wallet/wallet.service';
import { BlockchainService } from '../blockchain/blockchain.service';

function generateCode(): string {
  return randomBytes(5).toString('hex').toUpperCase();
}

@Injectable()
export class ZtroRewardsService {
  constructor(
    @Inject(FIRESTORE) private readonly db: Firestore,
    private readonly walletService: WalletService,
    private readonly blockchain: BlockchainService,
  ) {}

  private col() {
    return this.db.collection(COLLECTIONS.ZENTARO_ZTRO_REWARD_CODES);
  }

  async issue(count: number, baseValue: number) {
    const batch = this.db.batch();
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(generateCode());
    }

    for (const code of codes) {
      const ref = this.col().doc(code);
      batch.set(ref, {
        code,
        baseValue,
        status: 'unused',
        createdAt: FieldValue.serverTimestamp(),
        claimedBy: null,
        claimedAt: null,
        usedAt: null,
        amount: null,
        txHash: null,
      });
    }
    await batch.commit();

    const items = await Promise.all(
      codes.map(async (code) => ({
        code,
        qrDataUrl: await QRCode.toDataURL(code, { margin: 1, width: 240 }),
      })),
    );

    return { issued: items.length, items };
  }

  async listAll() {
    const snap = await this.col().orderBy('createdAt', 'desc').get();
    return snap.docs.map((doc) => doc.data());
  }

  async poolBalance() {
    const balance = await this.blockchain.getPoolBalance();
    return { balance: Number(balance) };
  }

  async redeem(uid: string, rawCode: string) {
    const code = rawCode.toUpperCase();
    const codeRef = this.col().doc(code);

    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(codeRef);
      if (!snap.exists) {
        throw new NotFoundException('유효하지 않은 QR 코드입니다.');
      }
      const doc = snap.data()!;
      if (doc.status !== 'unused') {
        throw new BadRequestException('이미 사용되었거나 유효하지 않은 QR입니다.');
      }
      tx.update(codeRef, {
        status: 'pending',
        claimedBy: uid,
        claimedAt: FieldValue.serverTimestamp(),
      });
    });

    const baseValue = (await codeRef.get()).data()!.baseValue as number;

    try {
      const { address } = await this.walletService.getOrCreateChainWallet(uid);
      const { amount, txHash } = await this.blockchain.sendReward(
        address,
        code,
        baseValue,
      );
      const amountNumber = Number(amount);

      await codeRef.update({
        status: 'used',
        amount: amountNumber,
        txHash,
        usedAt: FieldValue.serverTimestamp(),
      });

      return { amount: amountNumber, txHash, walletAddress: address };
    } catch (err) {
      // Release the lock so the code stays valid — the user (or the code itself)
      // wasn't at fault for an RPC/tx failure.
      await codeRef.update({
        status: 'unused',
        claimedBy: null,
        claimedAt: null,
      });
      throw err;
    }
  }
}
