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

  constructor(private readonly config: ConfigService) {}

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
    const hex = this.config.get<string>('WALLET_ENCRYPTION_KEY');
    if (!hex || hex.length !== 64) {
      throw new InternalServerErrorException(
        'WALLET_ENCRYPTION_KEY must be set to a 32-byte hex string',
      );
    }
    return Buffer.from(hex, 'hex');
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
