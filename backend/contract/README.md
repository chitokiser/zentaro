# ZENTARO Token Contracts

## Ztaro Token — `zentaro.sol` (contract `Zentaro`)

- Fixed supply: 1,000,000,000 (decimals: 0)
- Network: opBNB
- **Deployed address: `0xdD98e6425f1fc7Ca536cd6bba9674f1E270cB30C`**
- PancakeSwap V2 pair (Ztaro/USDT): `0x5A65805fb99cF5B7E50d567C4029aF62531bE53c`

This is a full re-deployment, not an upgrade. The original ZTRO token
(`0xF4E758D3461886f7dD5af3E86f622e171113A568`) is **abandoned** — 700,000,000 of its
1,000,000,000 supply got stuck in the old vault contract (see below) with no rescue path,
and rather than patch around that, the decision was to cut over to a brand new token from
scratch. Existing ZTRO balances (custodial wallets, the old PancakeSwap pool, etc.) were
not migrated. Do not fund or reference the old ZTRO address for anything going forward.

## HEX (HeritageX Token) — `hex.sol`

- Fixed supply: 1,000,000,000 (decimals: 0)
- Network: opBNB
- Deployed address: `0x41F2Ea9F4eF7c4E35ba1a8438fC80937eD4E5464`

## Revenue / reward policy

ZENTARO accrues 10% of sales revenue as HEX (exchanged via opBNB USDT) to
reward token holders.

## ZentaroBank (`ZentaroBank.sol`)

Staking/dividend contract (`ztrobank`) that pays out the accrued HEX to
stakers. References the HEX token above at
`0x41F2Ea9F4eF7c4E35ba1a8438fC80937eD4E5464`.

## ZtaroVaultDAO (`ZtaroVaultDAO.sol`)

- Network: opBNB
- **Deployed address: `0x9c20817B074DAe2298d07cAC587667214eA0DC01`**
- Constructor arg: the Ztaro token address above.
- Owner: `0xE1F72796e5d76193fC38e976B033b5C646e6C230` (the deployer's own wallet — the
  backend's `RELAYER_PRIVATE_KEY` wallet is deliberately **not** the owner; all
  owner-only calls (`createProposal`, `executeProposal`, `setWithdrawApproval`,
  `setTransferApproval`, ...) have to be signed manually from that wallet, e.g. via
  Remix's "At Address" + Interact tab).

Staking + DAO withdrawal vault. Users `stake(amount, lockDays)` (lock must be a multiple
of 30 days, 30–1095), and after the lock expires and the owner grants
`setWithdrawApproval`/`setTransferApproval`, they can `unstake()` then `transferOut()`.

Governance withdrawals work against the contract's **entire raw token balance** minus
whatever is currently staked or already reserved by a pending proposal
(`availableReserve()`/`getReserveBalance()`) — there is no separate "admin reserve"
bookkeeping to remember to use. Just `transfer()` tokens to the vault address directly
and they immediately count as available. (The previous version,
`ZTROVaultDAO.sol` — now removed from this repo, still recoverable from git history —
required a special `depositAdminReserve()` call to make funds withdrawable; 700M sent via
a plain `transfer()` bypassed that bookkeeping and became permanently stuck. This version
exists specifically so that mistake can't happen again.)

`createProposal(amount)` is owner-only, checks `amount <= availableReserve()` at creation
time, and always targets the current `owner()` as recipient on execution — there is no
arbitrary-recipient parameter. A proposal passes with ≥80% yes votes (weighted by
snapshotted stake at proposal-creation time) after the 7-day voting period ends, then
`executeProposal()` sends the funds.

### Deployment (manual, via Remix)

1. Compile with Solidity `^0.8.20`, OpenZeppelin v5.x (Remix resolves the
   `@openzeppelin/contracts/...` imports automatically).
2. Deploy with constructor arg `_ztaro` = the Ztaro token address.
3. Fund it for governance proposals with a plain `transfer(vaultAddress, amount)` from
   the Ztaro token contract — no special deposit function needed.

## ZtroRewardDispenser (`ZtroRewardDispenser.sol`)

- Network: opBNB
- **Deployed address: `0x9cCe9d0737c5B0F7aC3c5B5a18D4d34897A2a8AD`** (points at the new
  Ztaro token; the old v2 instance at `0xB019DF1086b634Abd4459cCD96BeD3aa56b0fd45`, which
  paid out the abandoned ZTRO token, is retired. The v1 address
  (`0x75C940770e4d480BeAddE8e0f6d5fab3375Df95f`, never funded) was already retired before
  that.)
- `owner` and `relayer` are **not** the same wallet on this deployment — `relayer` is set
  to the backend's `RELAYER_PRIVATE_KEY` wallet (`0xd0b8E0Dbb658d24cA59aa7108f582daD98Dd2A27`)
  via `setRelayer()` after deploy, separate from the owner/deployer wallet
  (`0xE1F72796e5d76193fC38e976B033b5C646e6C230`).
- Includes `withdrawExcess(to, amount)` (owner-only) added after the original deploy —
  without it, tokens sent to this contract could only ever leave via `reward()` payouts,
  the same "no rescue path" trap the vault hit.

QR-scan event contract for `/rewards/bottle-cap`. The backend relayer wallet calls
`reward(to, requestId, baseValue)` once per redeemed QR code — `baseValue` is the
multiplier the admin set when issuing that QR batch. The contract draws a random
multiplier from a weighted tier table and pays out `baseValue x randomMultiplier` Ztaro
(whole tokens, since Ztaro has `decimals = 0`). Default tiers:

| Range         | Probability |
|---------------|-------------|
| 1 – 100       | 50%         |
| 100 – 500     | 30%         |
| 500 – 2,500   | 10%         |
| 2,500 – 5,000 | 7%          |
| 5,000 – 10,000| 3%          |

Owner can retune this table later via `setTiers(...)` (probabilities in bps must sum to
10000). `requestId = keccak256(bytes(code))` is recorded in `usedRequests` so the same
code can never pay out twice on-chain, even as a second line of defense behind the
backend's own single-use Firestore lock.

**Pool sizing:** worst case per redemption is `baseValue x 10,000` — size the funded
pool (and pick `baseValue` at issuance) with that ceiling in mind.

**Randomness caveat:** the on-chain "randomness" (`blockhash`/`timestamp`-derived) is
not adversarially secure — it's fine here only because the sole authorized caller
(`relayer`) is our own trusted backend, not an arbitrary user. Do not reuse this pattern
for anything where the caller has an incentive to manipulate the result.

**Custody model:** the backend generates and holds each user's custodial wallet private
key (encrypted at rest). This is a pragmatic MVP, not a non-custodial wallet — the
backend operator can technically move funds out of any user's custodial address.

### Deployment (manual, via Remix — same as the other contracts here)

1. Compile with Solidity `^0.8.20`.
2. Deploy with constructor args `(ztroToken, initialRelayer)`:
   - `ztroToken` = the Ztaro token address above
   - `initialRelayer` = the backend's relayer wallet address (the one whose private key
     goes into `RELAYER_PRIVATE_KEY` — generate a **fresh** wallet for this; never reuse
     a key that has ever been pasted into a chat or committed anywhere)
3. Fund the reward pool by sending Ztaro directly to the deployed contract address
   (plain `transfer(dispenserAddress, amount)` from the token holder), then
   optionally call `notifyFunded(amount)` for an on-chain log entry.
4. Fund the relayer wallet itself with a small amount of native BNB — it pays gas for
   every `reward()` call.
5. Set `ZTRO_REWARD_CONTRACT_ADDRESS` in the backend `.env` to the deployed address.
