import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';

const REWARD_DISPENSER_ABI = [
  'function reward(address to, bytes32 requestId, uint256 baseValue) external returns (uint256 amount)',
  'event Rewarded(address indexed to, bytes32 indexed requestId, uint256 baseValue, uint256 randomNumber, uint256 amount)',
  'function poolBalance() external view returns (uint256)',
];

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

const ZTROBANK_ABI = [
  'function buy(uint256 amount, uint256 maxPay) external returns (bool)',
  'function sell(uint256 amount) external returns (bool)',
  'function stake(uint256 amount) external returns (bool)',
  'function withdraw() external returns (bool)',
  'function claimDividend() external returns (bool)',
  'function pendingDividend(address who) public view returns (uint256)',
  'function price() view returns (uint256)',
  'function effectiveStaked() public view returns (uint256)',
  'function act() view returns (uint8)',
  'function rate() view returns (uint8)',
  'function STAKE_LOCK() view returns (uint256)',
  'function DIV_INTERVAL() view returns (uint256)',
  'function user(address who) external view returns (uint256 totalAllow, uint256 totalBuy, uint256 depo, uint256 stakingTime, uint256 lastClaim)',
  'function userStatsBase(address who) external view returns (uint256 netQty, uint256 avgBuyPriceWei, uint256 totalPayUsdtWei, uint256 totalSellUsdtWei)',
  'function myDashboard(address who) external view returns (uint256 myActualQty, uint256 currentPriceWei, uint256 myMarketCapWei, uint256 myAvgBuyPriceWei, int256 myPnlWei, int256 myRoiBps_)',
  'event Bought(address indexed who, uint256 amount, uint256 payUsdtWei, uint256 autoStaked, uint256 received)',
  'event Sold(address indexed who, uint256 amount, uint256 recvUsdtWei, uint256 feeUsdtWei)',
  'event DividendClaimed(address indexed who, uint256 payUsdtWei)',
];

/**
 * Talks to opBNB: holds the single relayer wallet that pays gas for every on-chain
 * call, and generates/encrypts custodial wallets for users. The relayer wallet must
 * also be the `relayer` address configured on the deployed ZtroRewardDispenser
 * contract (see backend/contract/ZtroRewardDispenser.sol).
 */
@Injectable()
export class BlockchainService {
  private _provider?: ethers.JsonRpcProvider;
  private _relayer?: ethers.Wallet;
  private _contract?: ethers.Contract;

  constructor(private readonly config: ConfigService) { }

  private get provider(): ethers.JsonRpcProvider {
    if (!this._provider) {
      const url = this.config.get<string>('OPBNB_RPC_URL');
      if (!url) {
        throw new InternalServerErrorException('OPBNB_RPC_URL not configured');
      }
      this._provider = new ethers.JsonRpcProvider(url);
    }
    return this._provider;
  }

  /** Read-only runner for view calls that don't need a signer. */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  private get relayer(): ethers.Wallet {
    if (!this._relayer) {
      const privateKey = this.config.get<string>('RELAYER_PRIVATE_KEY');
      if (!privateKey) {
        throw new InternalServerErrorException(
          'RELAYER_PRIVATE_KEY not configured',
        );
      }
      this._relayer = new ethers.Wallet(privateKey, this.provider);
    }
    return this._relayer;
  }

  private get contract(): ethers.Contract {
    if (!this._contract) {
      const address = this.config.get<string>('ZTRO_REWARD_CONTRACT_ADDRESS');
      if (!address) {
        throw new InternalServerErrorException(
          'ZTRO_REWARD_CONTRACT_ADDRESS not configured',
        );
      }
      this._contract = new ethers.Contract(
        address,
        REWARD_DISPENSER_ABI,
        this.relayer,
      );
    }
    return this._contract;
  }

  /** Read-only — doesn't need RELAYER_PRIVATE_KEY, just the RPC provider. */
  async getPoolBalance(): Promise<bigint> {
    const address = this.config.get<string>('ZTRO_REWARD_CONTRACT_ADDRESS');
    if (!address) {
      throw new InternalServerErrorException(
        'ZTRO_REWARD_CONTRACT_ADDRESS not configured',
      );
    }
    const contract = new ethers.Contract(
      address,
      REWARD_DISPENSER_ABI,
      this.provider,
    );
    return contract.poolBalance();
  }

  /** Generates a fresh, offline keypair — no RPC call. */
  createCustodialWallet(): { address: string; privateKey: string } {
    const wallet = ethers.Wallet.createRandom();
    return { address: wallet.address, privateKey: wallet.privateKey };
  }

  /**
   * Wraps a decrypted private key in a signer. Caller must not persist or log the key
   * or this signer — it's scoped to a single request's on-chain calls.
   */
  getUserSigner(privateKey: string): ethers.Wallet {
    return new ethers.Wallet(privateKey, this.provider);
  }

  private requireEnv(name: string): string {
    const value = this.config.get<string>(name);
    if (!value) {
      throw new InternalServerErrorException(`${name} not configured`);
    }
    return value;
  }

  getBankContract(runner: ethers.ContractRunner): ethers.Contract {
    return new ethers.Contract(
      this.requireEnv('ZTROBANK_CONTRACT_ADDRESS'),
      ZTROBANK_ABI,
      runner,
    );
  }

  getUsdtContract(runner: ethers.ContractRunner): ethers.Contract {
    return new ethers.Contract(
      this.requireEnv('USDT_TOKEN_ADDRESS'),
      ERC20_ABI,
      runner,
    );
  }

  getZtroContract(runner: ethers.ContractRunner): ethers.Contract {
    return new ethers.Contract(
      this.requireEnv('ZTRO_TOKEN_ADDRESS'),
      ERC20_ABI,
      runner,
    );
  }

  /**
   * Custodial wallets start with 0 native BNB. Tops one up from the relayer wallet
   * before a user transaction needs to pay its own gas — "invisible gas" for the user.
   */
  async ensureGas(address: string): Promise<void> {
    const thresholdBnb = this.config.get<string>('GAS_TOPUP_THRESHOLD_BNB') ?? '0.0004';
    const topupBnb = this.config.get<string>('GAS_TOPUP_BNB') ?? '0.0008';

    const balance = await this.provider.getBalance(address);
    const threshold = ethers.parseEther(thresholdBnb);
    if (balance >= threshold) return;

    const tx = await this.relayer.sendTransaction({
      to: address,
      value: ethers.parseEther(topupBnb),
    });
    await tx.wait();
  }

  /**
   * Calls ZtroRewardDispenser.reward(to, requestId, baseValue) and returns the actual
   * amount the contract decided to send (baseValue x an on-chain-drawn random
   * multiplier), read back from the Rewarded event log — the amount isn't known ahead
   * of time, it's computed on-chain per the tx's blockhash.
   */
  async sendReward(
    toAddress: string,
    code: string,
    baseValue: number,
  ): Promise<{ amount: bigint; txHash: string }> {
    const requestId = ethers.id(code);
    const tx = await this.contract.reward(toAddress, requestId, baseValue);
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error('Reward transaction failed');
    }

    let amount: bigint | undefined;
    for (const log of receipt.logs) {
      try {
        const parsed = this.contract.interface.parseLog(log);
        if (parsed?.name === 'Rewarded') {
          amount = parsed.args.amount as bigint;
          break;
        }
      } catch {
        // not our event — ignore
      }
    }
    if (amount === undefined) {
      throw new Error('Rewarded event not found in transaction receipt');
    }

    return { amount, txHash: receipt.hash as string };
  }

  private encryptionKey(): Buffer {
    let rawKey = this.config.get<string>('WALLET_ENCRYPTION_KEY');
    if (!rawKey) {
      throw new InternalServerErrorException(
        'WALLET_ENCRYPTION_KEY not configured',
      );
    }

    if (rawKey.startsWith('0x')) {
      rawKey = rawKey.slice(2);
    }

    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      return Buffer.from(rawKey, 'hex');
    }

    const { createHash } = require('node:crypto');
    return createHash('sha256').update(rawKey).digest();
  }

  /** AES-256-GCM, random IV per call. Output: "iv.tag.ciphertext" (all base64). */
  encryptPrivateKey(privateKey: string): string {
    const key = this.encryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.concat([
      cipher.update(privateKey, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return [iv, tag, data].map((b) => b.toString('base64')).join('.');
  }

  decryptPrivateKey(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split('.');
    const key = this.encryptionKey();
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const out = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);
    return out.toString('utf8');
  }
}
