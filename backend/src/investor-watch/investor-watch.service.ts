import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateWatchDto } from './dto/create-watch.dto';

/**
 * Watches specific ZTARO wallets (e.g. investor grants) and flags an admin alert once the
 * wallet's cumulative balance decrease since it was registered crosses a configured
 * threshold.
 *
 * IMPORTANT LIMITATION: the free public opBNB RPC this backend uses doesn't allow
 * historical eth_getLogs (archive) queries, so this can't distinguish "sold on
 * PancakeSwap" from "transferred to another wallet" — it only tracks net balance drops
 * between polls (any incoming transfer resets that poll's delta to 0, never negative).
 * Good enough as a "did this wallet's balance shrink by more than X" tripwire, not a
 * precise on-chain sell tracker.
 */
@Injectable()
export class InvestorWatchService {
  constructor(
    @Inject(FIRESTORE) private readonly db: Firestore,
    private readonly blockchain: BlockchainService,
  ) {}

  private col() {
    return this.db.collection(COLLECTIONS.ZENTARO_INVESTOR_WATCHLIST);
  }

  async create(dto: CreateWatchDto) {
    const ref = this.col().doc();
    await ref.set({
      address: dto.address,
      label: dto.label,
      grantDate: Timestamp.fromDate(new Date(dto.grantDate)),
      grantAmount: dto.grantAmount ?? null,
      sellThreshold: dto.sellThreshold,
      lastKnownBalance: null,
      cumulativeDecrease: 0,
      alertTriggered: false,
      alertTriggeredAt: null,
      alertAcknowledgedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { id: ref.id };
  }

  async listAll() {
    const snap = await this.col().orderBy('createdAt', 'desc').get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async delete(id: string) {
    const ref = this.col().doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('감시 대상을 찾을 수 없습니다.');
    await ref.delete();
    return { ok: true };
  }

  async acknowledge(id: string) {
    const ref = this.col().doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('감시 대상을 찾을 수 없습니다.');
    await ref.update({
      alertAcknowledgedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true };
  }

  /** Un-acknowledged active alerts — powers the admin nav badge. */
  async activeAlertCount(): Promise<{ count: number }> {
    const snap = await this.col().where('alertTriggered', '==', true).get();
    const count = snap.docs.filter((doc) => {
      const data = doc.data();
      const triggeredAt = data.alertTriggeredAt as Timestamp | null;
      const ackAt = data.alertAcknowledgedAt as Timestamp | null;
      if (!triggeredAt) return false;
      // Still "active" if never acknowledged, or acknowledged before this trigger fired.
      return !ackAt || ackAt.toMillis() < triggeredAt.toMillis();
    }).length;
    return { count };
  }

  /** Reject re-registering a wallet that's already watched. */
  private async assertNotAlreadyWatched(address: string) {
    const snap = await this.col().where('address', '==', address).limit(1).get();
    if (!snap.empty) {
      throw new BadRequestException('이미 감시 목록에 등록된 지갑 주소입니다.');
    }
  }

  async createChecked(dto: CreateWatchDto) {
    await this.assertNotAlreadyWatched(dto.address);
    return this.create(dto);
  }

  /** Polls every watched wallet's current ZTARO balance and updates cumulative decrease. */
  @Cron('0 * * * *')
  async pollBalances() {
    console.log('[InvestorWatch] Polling watched wallet balances...');
    const snap = await this.col().get();
    if (snap.empty) return;

    const ztro = this.blockchain.getZtroContract(this.blockchain.getProvider());

    for (const doc of snap.docs) {
      const data = doc.data();
      const address = data.address as string;
      try {
        const balance = Number(await ztro.balanceOf(address));
        const lastKnown = data.lastKnownBalance as number | null;

        if (lastKnown === null) {
          await doc.ref.update({ lastKnownBalance: balance, updatedAt: FieldValue.serverTimestamp() });
          continue;
        }

        const decrease = Math.max(0, lastKnown - balance);
        const cumulativeDecrease = (data.cumulativeDecrease as number) + decrease;
        const threshold = data.sellThreshold as number;
        const wasTriggered = data.alertTriggered as boolean;

        const update: Record<string, unknown> = {
          lastKnownBalance: balance,
          cumulativeDecrease,
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (!wasTriggered && cumulativeDecrease >= threshold) {
          update.alertTriggered = true;
          update.alertTriggeredAt = FieldValue.serverTimestamp();
        }

        await doc.ref.update(update);
      } catch (err) {
        console.error(`[InvestorWatch] Failed to poll ${address}:`, err);
      }
    }
  }
}
