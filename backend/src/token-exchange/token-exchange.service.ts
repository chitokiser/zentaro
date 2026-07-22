import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ethers } from 'ethers';
import { FieldValue } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { WalletService } from '../wallet/wallet.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';

function fmtUsdt(wei: bigint): number {
  return Number(ethers.formatUnits(wei, 18));
}

@Injectable()
export class TokenExchangeService {
  constructor(
    private readonly walletService: WalletService,
    private readonly blockchain: BlockchainService,
    @Inject(FIRESTORE) private readonly db: Firestore,
  ) { }

  async dashboard(uid: string) {
    const { address } = await this.walletService.getOrCreateChainWallet(uid);

    const provider = this.blockchain.getProvider();
    const bank = this.blockchain.getBankContract(provider);
    const usdt = this.blockchain.getUsdtContract(provider);
    const ztro = this.blockchain.getZtroContract(provider);

    const [
      ztroBalance,
      usdtBalance,
      price,
      userInfo,
      dashboardInfo,
      pendingDividend,
      effectiveStaked,
      act,
      rate,
      stakeLock,
      divInterval,
    ] = await Promise.all([
      ztro.balanceOf(address),
      usdt.balanceOf(address),
      bank.price(),
      bank.user(address),
      bank.myDashboard(address),
      bank.pendingDividend(address),
      bank.effectiveStaked(),
      bank.act(),
      bank.rate(),
      bank.STAKE_LOCK(),
      bank.DIV_INTERVAL(),
    ]);

    return {
      address,
      ztroBalance: Number(ztroBalance),
      usdtBalance: fmtUsdt(usdtBalance),
      priceUsdt: fmtUsdt(price),
      staked: Number(userInfo.depo),
      stakingTime: Number(userInfo.stakingTime),
      lastClaim: Number(userInfo.lastClaim),
      avgBuyPriceUsdt: fmtUsdt(dashboardInfo.myAvgBuyPriceWei),
      pnlUsdt: fmtUsdt(dashboardInfo.myPnlWei),
      roiBps: Number(dashboardInfo.myRoiBps_),
      pendingDividendUsdt: fmtUsdt(pendingDividend),
      effectiveStaked: Number(effectiveStaked),
      act: Number(act),
      sellFeePercent: Number(rate),
      stakeLockSeconds: Number(stakeLock),
      divIntervalSeconds: Number(divInterval),
      usdtTokenAddress: await usdt.getAddress(),
    };
  }

  async buy(uid: string, amount: number, maxPayUsdt?: number) {
    const { address, privateKey } =
      await this.walletService.getDecryptedPrivateKey(uid);
    await this.blockchain.ensureGas(address);
    const signer = this.blockchain.getUserSigner(privateKey);

    const bank = this.blockchain.getBankContract(signer);
    const usdt = this.blockchain.getUsdtContract(signer);
    const bankAddress = await bank.getAddress();

    const price: bigint = await bank.price();
    const estimatedPay = price * BigInt(amount);

    const allowance: bigint = await usdt.allowance(address, bankAddress);
    if (allowance < estimatedPay) {
      const approveTx = await usdt.approve(bankAddress, ethers.MaxUint256);
      await approveTx.wait();
    }

    const maxPay =
      maxPayUsdt !== undefined ? ethers.parseUnits(maxPayUsdt.toString(), 18) : 0n;

    const tx = await bank.buy(amount, maxPay);
    const receipt = await tx.wait();
    return this.parseReceipt(bank, receipt, 'Bought');
  }

  async sell(uid: string, amount: number) {
    const { address, privateKey } =
      await this.walletService.getDecryptedPrivateKey(uid);
    await this.blockchain.ensureGas(address);
    const signer = this.blockchain.getUserSigner(privateKey);

    const bank = this.blockchain.getBankContract(signer);
    const ztro = this.blockchain.getZtroContract(signer);
    const bankAddress = await bank.getAddress();

    const allowance: bigint = await ztro.allowance(address, bankAddress);
    if (allowance < BigInt(amount)) {
      const approveTx = await ztro.approve(bankAddress, ethers.MaxUint256);
      await approveTx.wait();
    }

    const tx = await bank.sell(amount);
    const receipt = await tx.wait();
    return this.parseReceipt(bank, receipt, 'Sold');
  }

  async stake(uid: string, amount: number) {
    try {
      const { address, privateKey } =
        await this.walletService.getDecryptedPrivateKey(uid);
      await this.blockchain.ensureGas(address);
      const signer = this.blockchain.getUserSigner(privateKey);

      const bank = this.blockchain.getBankContract(signer);
      const ztro = this.blockchain.getZtroContract(signer);
      const bankAddress = await bank.getAddress();

      const allowance: bigint = await ztro.allowance(address, bankAddress);
      if (allowance < BigInt(amount)) {
        const approveTx = await ztro.approve(bankAddress, ethers.MaxUint256);
        await approveTx.wait();
      }

      const tx = await bank.stake(amount);
      const receipt = await tx.wait();
      return { txHash: receipt.hash as string };
    } catch (err) {
      console.error('[TokenExchange] stake error:', err);
      throw new BadRequestException(
        err instanceof Error ? err.message : '스테이킹에 실패했습니다.',
      );
    }
  }

  async unstake(uid: string) {
    const { address, privateKey } =
      await this.walletService.getDecryptedPrivateKey(uid);
    await this.blockchain.ensureGas(address);
    const signer = this.blockchain.getUserSigner(privateKey);

    const bank = this.blockchain.getBankContract(signer);
    try {
      const tx = await bank.withdraw();
      const receipt = await tx.wait();
      return { txHash: receipt.hash as string };
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : '언스테이킹에 실패했습니다.',
      );
    }
  }

  async claimDividend(uid: string) {
    const { address, privateKey } =
      await this.walletService.getDecryptedPrivateKey(uid);
    await this.blockchain.ensureGas(address);
    const signer = this.blockchain.getUserSigner(privateKey);

    const bank = this.blockchain.getBankContract(signer);
    try {
      const tx = await bank.claimDividend();
      const receipt = await tx.wait();
      return this.parseReceipt(bank, receipt, 'DividendClaimed');
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : '배당 청구에 실패했습니다.',
      );
    }
  }

  private parseReceipt(
    bank: ethers.Contract,
    receipt: ethers.ContractTransactionReceipt,
    eventName: string,
  ) {
    for (const log of receipt.logs) {
      try {
        const parsed = bank.interface.parseLog(log);
        if (parsed?.name === eventName) {
          return { txHash: receipt.hash, event: parsed.name, args: parsed.args };
        }
      } catch {
        // not our event — ignore
      }
    }
    return { txHash: receipt.hash };
  }

  @Cron('0 0 * * 0')
  async distributeWeeklyStakingRewards() {
    console.log('[StakingReward] Starting weekly ZTRO staking EXP reward distribution...');
    try {
      const walletsSnap = await this.db.collection(COLLECTIONS.ZENTARO_WALLETS).get();
      const provider = this.blockchain.getProvider();
      const bank = this.blockchain.getBankContract(provider);

      let processedCount = 0;
      let totalExpDistributed = 0;

      for (const walletDoc of walletsSnap.docs) {
        const walletData = walletDoc.data();
        const address = walletData.chainAddress;

        if (!address) continue;

        try {
          const userInfo = await bank.user(address);
          const stakedZtro = Number(userInfo.depo);

          const expAmount = Math.floor(stakedZtro / 100); // 10,000 ZTRO staked = 100 EXP/week

          if (expAmount > 0) {
            const userId = walletDoc.id;

            await this.db.runTransaction(async (tx) => {
              const userWalletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(userId);
              const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();

              tx.set(userWalletRef, { exp: FieldValue.increment(expAmount) }, { merge: true });

              tx.set(txRef, {
                userId,
                amount: expAmount,
                type: 'staking_exp_reward',
                description: `ZTRO 스테이킹 주간 보상 (스테이킹 수량: ${stakedZtro.toLocaleString()} ZTRO)`,
                stakedAmount: stakedZtro,
                createdAt: FieldValue.serverTimestamp(),
              });
            });

            console.log(`[StakingReward] Distributed ${expAmount} EXP to user ${userId} (address: ${address})`);
            processedCount++;
            totalExpDistributed += expAmount;
          }
        } catch (walletErr) {
          console.error(`[StakingReward] Error processing wallet address ${address}:`, walletErr);
        }
      }

      console.log(`[StakingReward] Weekly distribution complete. Processed ${processedCount} users. Total EXP: ${totalExpDistributed}`);
      return { processedCount, totalExpDistributed };
    } catch (err) {
      console.error('[StakingReward] Global staking reward distribution error:', err);
      throw err;
    }
  }

  async createBarrelOrder(uid: string, size: string) {
    const BARREL_REQUIREMENTS: Record<string, { stakedZtro: number; expCost: number }> = {
      '5L': { stakedZtro: 50000, expCost: 500000 },
      '10L': { stakedZtro: 100000, expCost: 1000000 },
      '20L': { stakedZtro: 200000, expCost: 2000000 },
      '40L': { stakedZtro: 400000, expCost: 4000000 },
    };

    const reqs = BARREL_REQUIREMENTS[size];
    if (!reqs) {
      throw new BadRequestException('올바르지 않은 배럴 크기입니다.');
    }

    const { address } = await this.walletService.getOrCreateChainWallet(uid);
    if (!address) {
      throw new BadRequestException('지갑 주소를 가져올 수 없거나 생성되지 않았습니다.');
    }

    const provider = this.blockchain.getProvider();
    const bank = this.blockchain.getBankContract(provider);
    const userInfo = await bank.user(address);
    const stakedZtro = Number(userInfo.depo);

    if (stakedZtro < reqs.stakedZtro) {
      throw new BadRequestException(`ZTRO 스테이킹 요건이 부족합니다. 최소 ${reqs.stakedZtro.toLocaleString()} ZTRO 스테이킹이 필요합니다. (현재: ${stakedZtro.toLocaleString()} ZTRO)`);
    }

    const userWalletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);
    const userWalletSnap = await userWalletRef.get();
    const walletData = userWalletSnap.exists ? userWalletSnap.data() : null;
    const currentExp = Number(walletData?.exp || 0);

    if (currentExp < reqs.expCost) {
      throw new BadRequestException(`EXP 잔액이 부족합니다. 최소 ${reqs.expCost.toLocaleString()} EXP가 필요합니다. (현재: ${currentExp.toLocaleString()} EXP)`);
    }

    const barrelId = `ZT-REV-${size}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const certNumber = `CERT-ZT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const qrKey = Math.random().toString(36).substring(2, 12).toUpperCase();

    await this.db.runTransaction(async (tx) => {
      // Deduct EXP
      tx.set(userWalletRef, { exp: FieldValue.increment(-reqs.expCost) }, { merge: true });

      // Log transaction
      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: uid,
        amount: -reqs.expCost,
        type: 'barrel_order',
        description: `ZenTaro Barrel Reserve ${size} 배럴 주문 및 EXP 차감`,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Create new barrel document
      const barrelRef = this.db.collection(COLLECTIONS.ZENTARO_BARRELS).doc(barrelId);
      tx.set(barrelRef, {
        id: barrelId,
        userId: uid,
        capacity: size,
        status: 'ordered',
        createdAt: FieldValue.serverTimestamp(),
        productionDate: FieldValue.serverTimestamp(),
        fillingDate: FieldValue.serverTimestamp(),
        agingPeriod: '0개월',
        sealStatus: 'SECURED',
        certNumber,
        qrKey,
        ownershipHistory: [
          {
            date: new Date().toISOString(),
            ownerId: uid,
            ownerAddress: address,
            action: 'initial_reservation',
            message: '최초 배럴 예약 및 소유 증명서 발급 완료',
          }
        ]
      });
    });

    return { success: true, barrelId, certNumber };
  }

  async listMyBarrels(uid: string) {
    const snap = await this.db.collection(COLLECTIONS.ZENTARO_BARRELS)
      .where('userId', '==', uid)
      .get();

    const list = snap.docs.map(doc => doc.data());
    return list.sort((a: any, b: any) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  }

  async triggerBarrelAction(uid: string, barrelId: string, action: string) {
    const barrelRef = this.db.collection(COLLECTIONS.ZENTARO_BARRELS).doc(barrelId);
    const barrelSnap = await barrelRef.get();

    if (!barrelSnap.exists) {
      throw new BadRequestException('존재하지 않는 배럴입니다.');
    }

    const barrelData = barrelSnap.data();
    if (barrelData?.userId !== uid) {
      throw new BadRequestException('해당 배럴의 소유권 권한이 없습니다.');
    }

    let nextStatus = barrelData.status;
    let nextSealStatus = barrelData.sealStatus || 'SECURED';
    let historyMessage = '';

    if (action === 'room_aging') {
      nextStatus = '위탁 숙성 중 (Room Aging)';
      historyMessage = 'ZenTaro Barrel Room 위탁 숙성 시작';
    } else if (action === 'deliver') {
      nextStatus = '직접 배송 완료';
      nextSealStatus = 'DELIVERED (봉인 유지 인도)';
      historyMessage = '자택 직접 배송 요청 접수 및 봉인 인도';
    } else if (action === 'bottle') {
      nextStatus = '병입 완료 및 출고';
      nextSealStatus = 'UNSEALED';
      historyMessage = '개인 병입 완료 및 한정판 스피릿 출고';
    } else if (action === 'extend_aging') {
      nextStatus = '숙성 연장 중';
      historyMessage = '배럴 숙성 기간 연장 신청 접수';
    } else if (action === 'engrave') {
      nextStatus = '각인 완료';
      historyMessage = '개인 기념 문구 배럴 각인 완료';
    } else {
      throw new BadRequestException('정의되지 않은 배럴 액션 서비스입니다.');
    }

    const historyEntry = {
      date: new Date().toISOString(),
      ownerId: uid,
      action,
      message: historyMessage,
    };

    await barrelRef.update({
      status: nextStatus,
      sealStatus: nextSealStatus,
      ownershipHistory: FieldValue.arrayUnion(historyEntry),
    });

    return { success: true, nextStatus, nextSealStatus };
  }
}
