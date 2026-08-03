/** Minimal client for opBNBScan's Etherscan-family explorer API (account/tokentx). */

export interface TokenTransfer {
  hash: string;
  blockNumber: number;
  timeStamp: number;
  from: string;
  to: string;
  value: number;
  tokenDecimal: number;
  contractAddress: string;
}

const OPBNBSCAN_API_BASE = 'https://api-opbnb.bscscan.com/api';

/**
 * Fetches ERC20 transfer history for one token contract, for one wallet, from
 * `startBlock` onward (ascending order). Returns [] both when there are genuinely no
 * transfers and when the API key is missing/invalid — callers should log a distinct
 * warning up front if `apiKey` is falsy rather than relying on this to signal that.
 */
export async function fetchTokenTransfers(
  address: string,
  contractAddress: string,
  apiKey: string,
  startBlock: number,
): Promise<TokenTransfer[]> {
  const params = new URLSearchParams({
    module: 'account',
    action: 'tokentx',
    address,
    contractaddress: contractAddress,
    startblock: String(startBlock),
    endblock: '99999999',
    sort: 'asc',
    apikey: apiKey,
  });
  const res = await fetch(`${OPBNBSCAN_API_BASE}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`opBNBScan request failed: ${res.status}`);
  }
  const json: any = await res.json();
  if (json.status !== '1') {
    // status "0" + "No transactions found" is a normal empty result, not an error.
    if (typeof json.message === 'string' && json.message.toLowerCase().includes('no transactions')) {
      return [];
    }
    throw new Error(`opBNBScan error: ${json.message ?? 'unknown'} — ${json.result ?? ''}`);
  }
  const rows = Array.isArray(json.result) ? json.result : [];
  return rows.map((row: any) => ({
    hash: String(row.hash),
    blockNumber: Number(row.blockNumber),
    timeStamp: Number(row.timeStamp),
    from: String(row.from).toLowerCase(),
    to: String(row.to).toLowerCase(),
    value: Number(row.value) / 10 ** Number(row.tokenDecimal),
    tokenDecimal: Number(row.tokenDecimal),
    contractAddress: String(row.contractAddress).toLowerCase(),
  }));
}
