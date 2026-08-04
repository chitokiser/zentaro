import { ethers } from 'ethers';

/** Decoded ERC20 Transfer log, value already adjusted for the token's decimals. */
export interface TokenTransfer {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: number;
}

const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');

/** NodeReal MegaNode's opBNB archive endpoint caps eth_getLogs at this many blocks per call. */
const MAX_BLOCK_RANGE = 50000;

function addressTopic(address: string): string {
  return ethers.zeroPadValue(address.toLowerCase(), 32);
}

/**
 * Fetches every Transfer event for `tokenAddress` where `walletAddress` is either the
 * sender or the receiver, across [fromBlock, toBlock], chunked to respect the archive
 * RPC's per-call block range limit. Requires an archive-capable RPC (the free public
 * opBNB RPC this backend otherwise uses does NOT support this — see investor-watch
 * module doc comment).
 */
export async function fetchWalletTokenTransfers(
  provider: ethers.JsonRpcProvider,
  tokenAddress: string,
  walletAddress: string,
  decimals: number,
  fromBlock: number,
  toBlock: number,
): Promise<TokenTransfer[]> {
  const walletTopic = addressTopic(walletAddress);
  const results: TokenTransfer[] = [];

  for (let start = fromBlock; start <= toBlock; start += MAX_BLOCK_RANGE) {
    const end = Math.min(start + MAX_BLOCK_RANGE - 1, toBlock);
    const [outgoing, incoming] = await Promise.all([
      provider.getLogs({
        address: tokenAddress,
        fromBlock: start,
        toBlock: end,
        topics: [TRANSFER_TOPIC, walletTopic, null],
      }),
      provider.getLogs({
        address: tokenAddress,
        fromBlock: start,
        toBlock: end,
        topics: [TRANSFER_TOPIC, null, walletTopic],
      }),
    ]);
    for (const log of [...outgoing, ...incoming]) {
      const from = ethers.getAddress(ethers.dataSlice(log.topics[1], 12)).toLowerCase();
      const to = ethers.getAddress(ethers.dataSlice(log.topics[2], 12)).toLowerCase();
      const raw = BigInt(log.data);
      results.push({
        hash: log.transactionHash,
        blockNumber: log.blockNumber,
        from,
        to,
        value: Number(raw) / 10 ** decimals,
      });
    }
  }
  return results;
}
