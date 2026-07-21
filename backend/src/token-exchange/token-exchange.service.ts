import { BadRequestException, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { WalletService } from '../wallet/wallet.service';
import { BlockchainService } from '../blockchain/blockchain.service';

function fmtUsdt(wei: bigint): number {
  return Number(ethers.formatUnits(wei, 18));
}

@Injectable()
export class TokenExchangeService {
  constructor(
    private readonly walletService: WalletService,
    private readonly blockchain: BlockchainService,
  ) {}

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
}
