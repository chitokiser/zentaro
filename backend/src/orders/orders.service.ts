import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';
import { COLLECTIONS } from '../common/collections';
import { CheckoutDto } from './dto/checkout.dto';
import { OrderStatus } from './dto/update-order-status.dto';
import { MailService } from '../mail/mail.service';
import { WalletService } from '../wallet/wallet.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ZtaroPricingService } from '../products/ztaro-pricing.service';

const MENTOR_REWARD_RATE = 0.05;

@Injectable()
export class OrdersService {
  constructor(
    @Inject(FIRESTORE) private readonly db: Firestore,
    private readonly mailService: MailService,
    private readonly walletService: WalletService,
    private readonly blockchain: BlockchainService,
    private readonly config: ConfigService,
    private readonly ztaroPricing: ZtaroPricingService,
  ) { }

  private ordersCol() {
    return this.db.collection(COLLECTIONS.ZENTARO_ORDERS);
  }

  /**
   * Runs the full multi-item checkout in one Firestore transaction: reads
   * every product line, validates AP/EXP totals against the same 80%-of-
   * margin / dropshipping-only EXP rule as the old single-item purchase
   * flow, debits the user's AP and EXP balances by the summed totals, and
   * writes one order doc covering every line item plus the shipping
   * address. The notification email is sent after the transaction commits
   * (network calls don't belong inside a Firestore transaction).
   */
  async checkout(uid: string, dto: CheckoutDto) {
    if (dto.paymentMethod === 'ztaro') {
      return this.checkoutZtaro(uid, dto);
    }

    // class-transformer instantiates dto.shippingAddress as a ShippingAddressDto
    // (via @Type), and Firestore refuses to serialize objects with a custom
    // prototype — so writes must use a plain-object copy, not the DTO instance.
    const shippingAddress = {
      recipientName: dto.shippingAddress.recipientName,
      phone: dto.shippingAddress.phone,
      postalCode: dto.shippingAddress.postalCode,
      addressLine1: dto.shippingAddress.addressLine1,
      addressLine2: dto.shippingAddress.addressLine2 ?? null,
      deliveryMemo: dto.shippingAddress.deliveryMemo ?? null,
    };
    const userRef = this.db.collection(COLLECTIONS.USERS).doc(uid);
    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);
    const productRefs = dto.items.map((item) =>
      this.db.collection(COLLECTIONS.ZENTARO_PRODUCTS).doc(item.productId),
    );



    const result = await this.db.runTransaction(async (tx) => {
      // 1. Read user document first to find mentor (referredBy)
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new NotFoundException('User not found');
      }

      const referredBy = userSnap.data()?.referredBy as string | undefined;
      let mentorSnap: any = null;
      let mentor2Snap: any = null;

      // 2. Read Level 1 Mentor (대리점) document
      if (referredBy) {
        const mentorRef = this.db.collection(COLLECTIONS.USERS).doc(referredBy);
        mentorSnap = await tx.get(mentorRef);
        if (mentorSnap && mentorSnap.exists) {
          const referredBy2 = mentorSnap.data()?.referredBy as string | undefined;
          // 3. Read Level 2 Mentor (총판) document
          if (referredBy2) {
            const mentor2Ref = this.db.collection(COLLECTIONS.USERS).doc(referredBy2);
            mentor2Snap = await tx.get(mentor2Ref);
          }
        }
      }

      // 4. Read user wallet and products in parallel (completes all required reads before writes)
      const [walletSnap, ...productSnaps] = await Promise.all([
        tx.get(walletRef),
        ...productRefs.map((ref) => tx.get(ref)),
      ]);

      let totalPriceAp = 0;
      let totalCostAp = 0;
      let totalExpCap = 0;
      let totalLevel1RewardExp = 0;
      let totalLevel2RewardExp = 0;
      const rewardedItemsList: string[] = [];

      const lineItems: Array<{
        productId: string;
        quantity: number;
        productName: string;
        fulfillmentType: string;
        priceAp: number;
        costAp: number;
      }> = [];

      dto.items.forEach((item, idx) => {
        const snap = productSnaps[idx];
        if (!snap.exists) {
          throw new NotFoundException(`Product not found: ${item.productId}`);
        }
        const product = snap.data()!;
        const priceAp: number = product.priceAp ?? 0;
        const costAp: number = product.costAp ?? priceAp;
        const fulfillmentType: string = product.fulfillmentType ?? 'dropshipping';
        const margin = Math.max(0, priceAp - costAp);
        const lineMaxExp = Math.floor(margin * 0.8);

        totalPriceAp += priceAp * item.quantity;
        totalCostAp += costAp * item.quantity;
        totalExpCap += lineMaxExp * item.quantity;

        // Mentor Reward Calculation per item
        if (product.mentorRewardEnabled) {
          const rate1 = product.level1MentorRate !== undefined ? product.level1MentorRate : 5;
          const rate2 = product.level2MentorRate !== undefined ? product.level2MentorRate : 5;

          const itemReward1 = Math.floor(item.quantity * priceAp * (rate1 / 100));
          const itemReward2 = Math.floor(item.quantity * priceAp * (rate2 / 100));

          totalLevel1RewardExp += itemReward1;
          totalLevel2RewardExp += itemReward2;
          rewardedItemsList.push(`${product.name} x${item.quantity}`);
        }

        lineItems.push({
          productId: item.productId,
          quantity: item.quantity,
          productName: product.name,
          fulfillmentType,
          priceAp,
          costAp,
        });
      });

      const expToUse = dto.expToUse ?? 0;
      const currentPoints: number = userSnap.data()!.points ?? 0;
      const currentExp: number = walletSnap.exists ? (walletSnap.data()!.exp ?? 0) : 0;

      if (expToUse > totalExpCap) {
        throw new BadRequestException('마진의 80%를 초과하는 EXP는 사용할 수 없습니다.');
      }
      if (expToUse > currentExp) {
        throw new BadRequestException('EXP 잔액이 부족합니다.');
      }

      const apToPay = totalPriceAp - expToUse;
      if (currentPoints < apToPay) {
        throw new BadRequestException('Insufficient ZP balance');
      }

      // --- ALL READS MUST BE BEFORE WRITES ---
      tx.update(userRef, { points: FieldValue.increment(-apToPay) });
      if (expToUse > 0) {
        tx.set(walletRef, { exp: FieldValue.increment(-expToUse) }, { merge: true });
      }
      if (dto.saveAddress) {
        tx.set(userRef, { shippingAddress }, { merge: true });
      }

      // Distribute the EXP/AP split proportionally per line
      let expRemaining = expToUse;
      const items = lineItems.map((line, idx) => {
        const lineTotal = line.priceAp * line.quantity;
        const isLast = idx === lineItems.length - 1;
        const lineExp = isLast ? expRemaining : Math.min(expRemaining, Math.round((lineTotal / Math.max(totalPriceAp, 1)) * expToUse));
        expRemaining -= lineExp;
        return { ...line, apPaid: lineTotal - lineExp, expPaid: lineExp };
      });

      const orderRef = this.ordersCol().doc();
      const orderData = {
        userId: uid,
        items,
        shippingAddress,
        totalPriceAp,
        totalCostAp,
        totalApPaid: apToPay,
        totalExpPaid: expToUse,
        status: 'paid' as OrderStatus,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      tx.set(orderRef, orderData);

      const productNames = items.map((i) => i.productName).join(', ');
      const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      tx.set(txRef, {
        userId: uid,
        amount: -apToPay,
        type: 'zentaro_mall_purchase',
        description: `ZENTARO Mall (ZP 결제): ${productNames}`,
        orderId: orderRef.id,
        createdAt: FieldValue.serverTimestamp(),
      });
      if (expToUse > 0) {
        const expTxRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
        tx.set(expTxRef, {
          userId: uid,
          amount: -expToUse,
          type: 'zentaro_mall_purchase',
          description: `ZENTARO Mall (EXP 결제): ${productNames}`,
          orderId: orderRef.id,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      // Level 1 Mentor (대리점) Reward
      if (referredBy && referredBy !== uid && totalLevel1RewardExp > 0 && mentorSnap && mentorSnap.exists) {
        const mentorWalletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(referredBy);
        tx.set(mentorWalletRef, { exp: FieldValue.increment(totalLevel1RewardExp) }, { merge: true });

        const mentorTxRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
        tx.set(mentorTxRef, {
          userId: referredBy,
          amount: totalLevel1RewardExp,
          type: 'mentor_referral_reward',
          description: `대리점 멘토 리워드 (멘티 구매 보너스): ${rewardedItemsList.join(', ')} (구매자: ${userSnap.data()!.email}, 총 구매액: ${totalPriceAp.toLocaleString()} ZP)`,
          orderId: orderRef.id,
          referredUserId: uid,
          referredUserEmail: userSnap.data()!.email ?? null,
          purchaseAmountAp: totalPriceAp,
          rewardLevel: 1,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      // Level 2 Mentor (총판) Reward
      const referredBy2 = mentor2Snap?.id ?? null;
      if (referredBy2 && referredBy2 !== uid && totalLevel2RewardExp > 0 && mentor2Snap && mentor2Snap.exists) {
        const mentor2WalletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(referredBy2);
        tx.set(mentor2WalletRef, { exp: FieldValue.increment(totalLevel2RewardExp) }, { merge: true });

        const mentor2TxRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
        tx.set(mentor2TxRef, {
          userId: referredBy2,
          amount: totalLevel2RewardExp,
          type: 'mentor_referral_reward',
          description: `총판 멘토 리워드 (2단계 멘티 구매 보너스): ${rewardedItemsList.join(', ')} (구매자: ${userSnap.data()!.email}, 총 구매액: ${totalPriceAp.toLocaleString()} ZP)`,
          orderId: orderRef.id,
          referredUserId: uid,
          referredUserEmail: userSnap.data()!.email ?? null,
          purchaseAmountAp: totalPriceAp,
          rewardLevel: 2,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      return {
        orderId: orderRef.id,
        buyerEmail: userSnap.data()!.email ?? null,
        items,
        totalApPaid: apToPay,
        totalExpPaid: expToUse,
        remainingAp: currentPoints - apToPay,
        remainingExp: currentExp - expToUse,
      };
    });

    this.mailService
      .sendOrderNotification({
        orderId: result.orderId,
        buyerEmail: result.buyerEmail,
        items: result.items,
        totalApPaid: result.totalApPaid,
        totalExpPaid: result.totalExpPaid,
        shippingAddress,
      })
      .catch(() => undefined);

    return {
      orderId: result.orderId,
      totalApPaid: result.totalApPaid,
      totalExpPaid: result.totalExpPaid,
      remainingAp: result.remainingAp,
      remainingExp: result.remainingExp,
    };
  }

  /**
   * Mall-wide checkout paid in Ztaro instead of ZP. Every line item must already carry a
   * priceZtaro (server-computed for every product, see ZtaroPricingService) — a product
   * that hasn't been priced yet is rejected outright rather than silently falling back to
   * ZP for part of the cart. EXP can be applied on top for an extra discount, under the
   * same margin-based cap as the ZP checkout path (fulfillmentType==='dropshipping' only,
   * capped at 80% of priceAp-costAp margin) — converted to a Ztaro-amount reduction using
   * the same daily-fixed zpPerZtaro rate that priced the products.
   *
   * Follows the same lock -> on-chain transfer -> confirm/rollback shape as the barrel
   * P2P ZTRO settlement in token-exchange.service.ts's buyBarrel(): the order is written
   * as 'pending_payment' first (so nothing else has to guess whether a Ztaro transfer is
   * in flight), then the buyer's custodial wallet sends the total to the admin wallet,
   * and only a confirmed tx flips the order to 'paid'. A failed/reverted transfer deletes
   * the pending order and refunds any EXP already debited — the buyer's Ztaro never left
   * their wallet, so only the EXP debit needs reconciling.
   */
  /**
   * Sum of the custodial wallet's currently active vault stakes — the same "staked" figure
   * shown as `dashboard.staked` on the /exchange page (TokenExchangeService.dashboard()),
   * reimplemented narrowly here to avoid pulling that whole multi-call dashboard just for
   * one number on every ZTARO checkout.
   */
  private async getStakedZtaro(uid: string): Promise<number> {
    const { address } = await this.walletService.getOrCreateChainWallet(uid);
    const vault = this.blockchain.getVaultContract(this.blockchain.getProvider());
    const stakeIds: bigint[] = await vault.getAllStakes(address);
    let total = 0;
    for (const stakeId of stakeIds) {
      const s = await vault.stakes(stakeId);
      if (s.active) total += Number(s.amount);
    }
    return total;
  }

  private async checkoutZtaro(uid: string, dto: CheckoutDto) {
    const shippingAddress = {
      recipientName: dto.shippingAddress.recipientName,
      phone: dto.shippingAddress.phone,
      postalCode: dto.shippingAddress.postalCode,
      addressLine1: dto.shippingAddress.addressLine1,
      addressLine2: dto.shippingAddress.addressLine2 ?? null,
      deliveryMemo: dto.shippingAddress.deliveryMemo ?? null,
    };
    const userRef = this.db.collection(COLLECTIONS.USERS).doc(uid);
    const walletRef = this.db.collection(COLLECTIONS.ZENTARO_WALLETS).doc(uid);
    const productRefs = dto.items.map((item) =>
      this.db.collection(COLLECTIONS.ZENTARO_PRODUCTS).doc(item.productId),
    );

    const [zpPerZtaro, eligibility, stakedZtaro] = await Promise.all([
      this.ztaroPricing.getCurrentZpPerZtaro(),
      this.ztaroPricing.getEligibilityConfig(),
      this.getStakedZtaro(uid),
    ]);
    if (stakedZtaro < eligibility.minStakeZtaro) {
      throw new BadRequestException(
        `ZTARO 결제는 ${eligibility.minStakeZtaro.toLocaleString()} ZTARO 이상 스테이킹한 회원만 가능합니다. (현재 스테이킹: ${stakedZtaro.toLocaleString()} ZTARO)`,
      );
    }

    const { orderRef, totalPriceZtaro, expUsed, items, buyerEmail } = await this.db.runTransaction(
      async (tx) => {
        const [userSnap, walletSnap, ...productSnaps] = await Promise.all([
          tx.get(userRef),
          tx.get(walletRef),
          ...productRefs.map((ref) => tx.get(ref)),
        ]);
        if (!userSnap.exists) {
          throw new NotFoundException('User not found');
        }

        const memberLevel: number = walletSnap.exists ? (walletSnap.data()!.level ?? 1) : 1;
        if (memberLevel < eligibility.minLevel) {
          throw new BadRequestException(`ZTARO 결제는 레벨 ${eligibility.minLevel} 이상 회원만 가능합니다.`);
        }

        let totalPriceZtaro = 0;
        let totalExpCap = 0;
        const items = dto.items.map((item, idx) => {
          const snap = productSnaps[idx];
          if (!snap.exists) {
            throw new NotFoundException(`Product not found: ${item.productId}`);
          }
          const product = snap.data()!;
          const priceZtaro: number = product.priceZtaro ?? 0;
          if (priceZtaro <= 0) {
            throw new BadRequestException(`ZTARO 가격이 설정되지 않은 상품입니다: ${product.name}`);
          }
          const priceAp: number = product.priceAp ?? 0;
          const costAp: number = product.costAp ?? priceAp;
          const margin = Math.max(0, priceAp - costAp);
          const lineMaxExp = Math.floor(margin * 0.8);

          totalPriceZtaro += priceZtaro * item.quantity;
          totalExpCap += lineMaxExp * item.quantity;

          return {
            productId: item.productId,
            quantity: item.quantity,
            productName: product.name,
            priceZtaro,
          };
        });

        if (totalPriceZtaro <= 0) {
          throw new BadRequestException('ZTARO 결제 금액을 계산할 수 없습니다.');
        }

        const expToUse = dto.expToUse ?? 0;
        const currentExp: number = walletSnap.exists ? (walletSnap.data()!.exp ?? 0) : 0;
        if (expToUse > totalExpCap) {
          throw new BadRequestException('마진의 80%를 초과하는 EXP는 사용할 수 없습니다.');
        }
        if (expToUse > currentExp) {
          throw new BadRequestException('EXP 잔액이 부족합니다.');
        }

        const ztaroFromExp = zpPerZtaro > 0 ? Math.floor(expToUse / zpPerZtaro) : 0;
        if (ztaroFromExp >= totalPriceZtaro) {
          throw new BadRequestException(
            'ZTARO 결제 금액 전액을 EXP로 대체할 수 없습니다. 최소 1 ZTARO 이상은 실제로 결제해야 합니다.',
          );
        }
        totalPriceZtaro = totalPriceZtaro - ztaroFromExp;

        const orderRef = this.ordersCol().doc();
        tx.set(orderRef, {
          userId: uid,
          items,
          shippingAddress,
          paymentMethod: 'ztaro' as const,
          totalPriceZtaro,
          expUsed: expToUse,
          status: 'pending_payment',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        if (expToUse > 0) {
          tx.set(walletRef, { exp: FieldValue.increment(-expToUse) }, { merge: true });
        }
        if (dto.saveAddress) {
          tx.set(userRef, { shippingAddress }, { merge: true });
        }

        return {
          orderRef,
          totalPriceZtaro,
          expUsed: expToUse,
          items,
          buyerEmail: userSnap.data()!.email ?? null,
        };
      },
    );

    let txHash: string | null = null;
    try {
      if (totalPriceZtaro > 0) {
        const adminAddress = this.config.get<string>('ADMIN_ZTARO_ADDRESS');
        if (!adminAddress) {
          throw new Error('ADMIN_ZTARO_ADDRESS not configured');
        }
        const { address: buyerAddress, privateKey: buyerPrivateKey } =
          await this.walletService.getDecryptedPrivateKey(uid);

        await this.blockchain.ensureGas(buyerAddress);
        const buyerSigner = this.blockchain.getUserSigner(buyerPrivateKey);
        const ztro = this.blockchain.getZtroContract(buyerSigner);

        const buyerBalance: bigint = await ztro.balanceOf(buyerAddress);
        if (buyerBalance < BigInt(totalPriceZtaro)) {
          throw new BadRequestException(
            `ZTARO 잔액이 부족합니다. (필요: ${totalPriceZtaro.toLocaleString()} ZTARO, 보유: ${buyerBalance.toLocaleString()} ZTARO)`,
          );
        }

        const tx = await ztro.transfer(adminAddress, BigInt(totalPriceZtaro));
        const receipt = await tx.wait();
        txHash = receipt.hash as string;
      }
    } catch (err) {
      await orderRef.delete().catch(() => {});
      if (expUsed > 0) {
        await walletRef.set({ exp: FieldValue.increment(expUsed) }, { merge: true }).catch(() => {});
      }
      if (err instanceof BadRequestException) throw err;
      console.error('[Orders] checkoutZtaro on-chain ZTARO transfer failed:', err);
      throw new BadRequestException('온체인 ZTARO 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }

    await orderRef.update({
      status: 'paid',
      ztaroTxHash: txHash,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const productNames = items.map((i) => i.productName).join(', ');
    const txRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
    await txRef.set({
      userId: uid,
      amount: -totalPriceZtaro,
      type: 'zentaro_mall_purchase_ztaro',
      description: `ZENTARO Mall (ZTARO 결제): ${productNames}${txHash ? ` (tx: ${txHash})` : ''}`,
      orderId: orderRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });
    if (expUsed > 0) {
      const expTxRef = this.db.collection(COLLECTIONS.TRANSACTIONS).doc();
      await expTxRef.set({
        userId: uid,
        amount: -expUsed,
        type: 'zentaro_mall_purchase',
        description: `ZENTARO Mall (ZTARO 결제 + EXP 추가할인): ${productNames}`,
        orderId: orderRef.id,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    this.mailService
      .sendOrderNotification({
        orderId: orderRef.id,
        buyerEmail,
        items: items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          priceAp: 0,
          fulfillmentType: 'direct',
        })),
        totalApPaid: 0,
        totalExpPaid: expUsed,
        paymentMethod: 'ztaro',
        totalZtaroPaid: totalPriceZtaro,
        shippingAddress,
      })
      .catch(() => undefined);

    return { orderId: orderRef.id, totalPriceZtaro, expUsed, txHash };
  }

  async listAll(status?: string) {
    // Filtering by status in JS (rather than a Firestore composite index on
    // status + createdAt) keeps this simple at the current data volume.
    const snap = await this.ordersCol().orderBy('createdAt', 'desc').limit(500).get();
    const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return status ? docs.filter((d: any) => d.status === status) : docs;
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    const ref = this.ordersCol().doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new NotFoundException('Order not found');
    }
    await ref.update({ status, updatedAt: FieldValue.serverTimestamp() });
    return { id: orderId, status };
  }

  async countUnread() {
    const snap = await this.ordersCol().where('status', '==', 'paid').count().get();
    return { count: snap.data().count };
  }

  async getSalesReport(startDate?: string, endDate?: string) {
    const now = new Date();
    const end = endDate ? new Date(endDate) : now;
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const snap = await this.ordersCol()
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end)
      .get();

    const byKey = new Map<
      string,
      {
        date: string;
        fulfillmentType: string;
        orderCount: number;
        totalRevenue: number;
        totalCost: number;
        totalApPaid: number;
        totalExpPaid: number;
      }
    >();

    const totals = {
      orderCount: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalMargin: 0,
      totalApPaid: 0,
      totalExpPaid: 0,
    };

    snap.docs.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() ?? new Date();
      const date = createdAt.toISOString().slice(0, 10);
      const items = (data.items ?? []) as Array<{
        fulfillmentType: string;
        priceAp: number;
        costAp: number;
        quantity: number;
        apPaid: number;
        expPaid: number;
      }>;

      totals.orderCount += 1;
      totals.totalApPaid += data.totalApPaid ?? 0;
      totals.totalExpPaid += data.totalExpPaid ?? 0;

      items.forEach((item) => {
        const key = `${date}__${item.fulfillmentType}`;
        const revenue = item.priceAp * item.quantity;
        const cost = item.costAp * item.quantity;
        totals.totalRevenue += revenue;
        totals.totalCost += cost;

        const existing = byKey.get(key) ?? {
          date,
          fulfillmentType: item.fulfillmentType,
          orderCount: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalApPaid: 0,
          totalExpPaid: 0,
        };
        existing.orderCount += 1;
        existing.totalRevenue += revenue;
        existing.totalCost += cost;
        existing.totalApPaid += item.apPaid;
        existing.totalExpPaid += item.expPaid;
        byKey.set(key, existing);
      });
    });

    totals.totalMargin = totals.totalRevenue - totals.totalCost;

    const byDateType = Array.from(byKey.values())
      .map((row) => ({ ...row, totalMargin: row.totalRevenue - row.totalCost }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), totals, byDateType };
  }
}
