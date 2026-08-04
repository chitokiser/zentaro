import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { ethers } from 'ethers';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateWatchDto } from './dto/create-watch.dto';
import { fetchWalletTokenTransfers, type TokenTransfer } from './swap-log-client';

/** Same PancakeSwap V2 Ztaro/USDT pair the price snapshot cron and blockchain service read. */
const PANCAKE_ZTRO_USDT_POOL = '0x5a65805fb99cf5b7e50d567c4029af62531be53c';

/** ZTARO decimals=0 (raw balanceOf IS the token count); USDT on this chain uses 18. */
const ZTRO_DECIMALS = 0;
const USDT_DECIMALS = 18;

/**
 * ZTARO contract deployment block, found via binary search on eth_getCode (2026-08-04) —
 * no swap could exist before this, so it's a safe floor for a wallet's very first sync
 * (avoids scanning ~168M empty blocks from genesis).
 */
const ZTRO_DEPLOY_BLOCK = 168432290;

/**
 * Watches specific ZTARO wallets (e.g. investor grants) and flags an admin alert once the
 * wallet's cumulative balance decrease since it was registered crosses a configured
 * threshold. Also reconstructs PancakeSwap buy/sell history via archive eth_getLogs to
 * compute realized P&L — see syncSwapHistory() below.
 */
@Injectable()
export class InvestorWatchService {
  private _archiveProvider?: ethers.JsonRpcProvider;

  constructor(
    @Inject(FIRESTORE) private readonly db: Firestore,
    private readonly blockchain: BlockchainService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Separate from BlockchainService's provider — that one points at the free public
   * opBNB RPC, which rejects historical eth_getLogs. This points at a NodeReal MegaNode
   * archive endpoint (free tier includes archive access, capped at 50,000 blocks/call).
   */
  private get archiveProvider(): ethers.JsonRpcProvider | null {
    if (!this._archiveProvider) {
      const url = this.config.get<string>('OPBNB_ARCHIVE_RPC_URL');
      if (!url) return null;
      this._archiveProvider = new ethers.JsonRpcProvider(url);
    }
    return this._archiveProvider;
  }

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
      // Swap history / realized P&L — populated by syncSwapHistory() via archive eth_getLogs.
      swapSyncLastBlock: 0,
      costBasisQty: 0,
      avgCostUsdt: 0,
      totalBoughtZtaro: 0,
      totalBuyCostUsdt: 0,
      totalSoldZtaro: 0,
      totalSellProceedsUsdt: 0,
      realizedProfitUsdt: 0,
      swapSyncedAt: null,
      swapSyncError: null,
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

      try {
        await this.syncSwapHistory(doc.ref, data);
      } catch (err) {
        console.error(`[InvestorWatch] Failed to sync swap history for ${address}:`, err);
      }
    }
  }

  /** Manual trigger for the admin page's per-row "지금 동기화" button. */
  async syncOne(id: string) {
    const ref = this.col().doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('감시 대상을 찾을 수 없습니다.');
    await this.syncSwapHistory(ref, snap.data()!);
    return { ok: true };
  }

  /**
   * Reconstructs PancakeSwap buy/sell history for a watched wallet from archive
   * eth_getLogs (ZTARO + USDT Transfer events). A tx counts as a swap when, within the
   * same hash, the wallet sends ZTARO directly to the pool and receives USDT directly
   * from it (a sell), or the reverse (a buy) — this is how a direct PancakeSwap V2
   * single-hop swap moves tokens.
   *
   * Cost basis uses a moving-average method, and only tracks quantity actually bought
   * through a swap (`costBasisQty`). Any sale beyond that (e.g. selling tokens that were
   * granted for free, not purchased) is correctly treated as ~100% profit on that portion,
   * since there's no tracked cost for it.
   */
  private async syncSwapHistory(
    ref: FirebaseFirestore.DocumentReference,
    data: FirebaseFirestore.DocumentData,
  ): Promise<void> {
    const provider = this.archiveProvider;
    if (!provider) {
      await ref.update({ swapSyncError: 'OPBNB_ARCHIVE_RPC_URL not configured' });
      return;
    }
    const address = (data.address as string).toLowerCase();
    const ztroAddress = this.config.get<string>('ZTRO_TOKEN_ADDRESS');
    const usdtAddress = this.config.get<string>('USDT_TOKEN_ADDRESS');
    if (!ztroAddress || !usdtAddress) {
      await ref.update({ swapSyncError: 'ZTRO_TOKEN_ADDRESS or USDT_TOKEN_ADDRESS not configured' });
      return;
    }

    const storedLastBlock = (data.swapSyncLastBlock as number) ?? 0;
    const startBlock = Math.max(storedLastBlock + 1, ZTRO_DEPLOY_BLOCK);
    const latestBlock = await provider.getBlockNumber();
    if (startBlock > latestBlock) {
      await ref.update({ swapSyncedAt: FieldValue.serverTimestamp(), swapSyncError: null });
      return;
    }

    const [ztroTransfers, usdtTransfers] = await Promise.all([
      fetchWalletTokenTransfers(provider, ztroAddress, address, ZTRO_DECIMALS, startBlock, latestBlock),
      fetchWalletTokenTransfers(provider, usdtAddress, address, USDT_DECIMALS, startBlock, latestBlock),
    ]);

    if (ztroTransfers.length === 0 && usdtTransfers.length === 0) {
      await ref.update({
        swapSyncLastBlock: latestBlock,
        swapSyncedAt: FieldValue.serverTimestamp(),
        swapSyncError: null,
      });
      return;
    }

    const ztroByHash = new Map<string, TokenTransfer>();
    for (const t of ztroTransfers) ztroByHash.set(t.hash, t);
    const usdtByHash = new Map<string, TokenTransfer>();
    for (const t of usdtTransfers) usdtByHash.set(t.hash, t);

    type Swap = { block: number; kind: 'buy' | 'sell'; ztaroAmount: number; usdtAmount: number };
    const swaps: Swap[] = [];
    for (const [hash, ztro] of ztroByHash) {
      const usdt = usdtByHash.get(hash);
      if (!usdt) continue;
      const sell = ztro.from === address && ztro.to === PANCAKE_ZTRO_USDT_POOL && usdt.from === PANCAKE_ZTRO_USDT_POOL && usdt.to === address;
      const buy = ztro.to === address && ztro.from === PANCAKE_ZTRO_USDT_POOL && usdt.to === PANCAKE_ZTRO_USDT_POOL && usdt.from === address;
      if (sell) swaps.push({ block: ztro.blockNumber, kind: 'sell', ztaroAmount: ztro.value, usdtAmount: usdt.value });
      else if (buy) swaps.push({ block: ztro.blockNumber, kind: 'buy', ztaroAmount: ztro.value, usdtAmount: usdt.value });
    }
    swaps.sort((a, b) => a.block - b.block);

    let costBasisQty = (data.costBasisQty as number) ?? 0;
    let avgCostUsdt = (data.avgCostUsdt as number) ?? 0;
    let totalBoughtZtaro = (data.totalBoughtZtaro as number) ?? 0;
    let totalBuyCostUsdt = (data.totalBuyCostUsdt as number) ?? 0;
    let totalSoldZtaro = (data.totalSoldZtaro as number) ?? 0;
    let totalSellProceedsUsdt = (data.totalSellProceedsUsdt as number) ?? 0;
    let realizedProfitUsdt = (data.realizedProfitUsdt as number) ?? 0;

    for (const swap of swaps) {
      if (swap.kind === 'buy') {
        const newQty = costBasisQty + swap.ztaroAmount;
        avgCostUsdt = newQty > 0 ? (avgCostUsdt * costBasisQty + swap.usdtAmount) / newQty : 0;
        costBasisQty = newQty;
        totalBoughtZtaro += swap.ztaroAmount;
        totalBuyCostUsdt += swap.usdtAmount;
      } else {
        const costedQty = Math.min(swap.ztaroAmount, costBasisQty);
        const costOfSold = avgCostUsdt * costedQty;
        realizedProfitUsdt += swap.usdtAmount - costOfSold;
        costBasisQty = Math.max(0, costBasisQty - swap.ztaroAmount);
        totalSoldZtaro += swap.ztaroAmount;
        totalSellProceedsUsdt += swap.usdtAmount;
      }
    }

    await ref.update({
      swapSyncLastBlock: latestBlock,
      costBasisQty,
      avgCostUsdt,
      totalBoughtZtaro,
      totalBuyCostUsdt,
      totalSoldZtaro,
      totalSellProceedsUsdt,
      realizedProfitUsdt,
      swapSyncedAt: FieldValue.serverTimestamp(),
      swapSyncError: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}
