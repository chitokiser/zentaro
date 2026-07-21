# ZENTARO Token Contracts

## ZTRO (ZenTrao Utility Token) — `zentaro.sol`

- Fixed supply: 1,000,000,000 (decimals: 0)
- Network: opBNB
- Deployed address: `0x4c88B8b5caC7F6c3F28612fe4DcCA94e76541cee`

## HEX (HeritageX Token) — `hex.sol`

- Fixed supply: 1,000,000,000 (decimals: 0)
- Network: opBNB
- Deployed address: `0x41F2Ea9F4eF7c4E35ba1a8438fC80937eD4E5464`

## Revenue / reward policy

ZENTARO accrues 10% of sales revenue as HEX (exchanged via opBNB USDT) to
reward ZTRO token holders.

## ZentaroBank (`ZentaroBank.sol`)

Staking/dividend contract (`ztrobank`) that pays out the accrued HEX to
ZTRO stakers. References the HEX token above at
`0x41F2Ea9F4eF7c4E35ba1a8438fC80937eD4E5464`.

## ZtroRewardDispenser (`ZtroRewardDispenser.sol`)

- Network: opBNB
- **v2 deployed address: `0xe0F8e9Ce505e62aBe40E84Ac49777fF8333eE46a`** — payout formula
  changed from a flat 1–50 range to `baseValue x randomMultiplier`, so the ABI changed
  and required a fresh deployment. The v1 address
  (`0x75C940770e4d480BeAddE8e0f6d5fab3375Df95f`, never funded) is retired.
- `owner` and `relayer` are the same deployer wallet (a deliberate simplification for
  this MVP — see the security tradeoff noted in this repo's chat history: if the
  server's `RELAYER_PRIVATE_KEY` ever leaks, the attacker also gets `sweep()`/`pause()`
  admin power over the whole reward pool, not just the ability to call `reward()`).

QR-scan event contract for `/rewards/bottle-cap`. The backend relayer wallet calls
`reward(to, requestId, baseValue)` once per redeemed QR code — `baseValue` is the
multiplier the admin set when issuing that QR batch. The contract draws a random
multiplier from a weighted tier table and pays out `baseValue x randomMultiplier` ZTRO
(whole tokens, since ZTRO has `decimals = 0`). Default tiers:

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
   - `ztroToken` = `0x4c88B8b5caC7F6c3F28612fe4DcCA94e76541cee` (ZTRO on opBNB)
   - `initialRelayer` = the backend's relayer wallet address (the one whose private key
     goes into `RELAYER_PRIVATE_KEY` — generate a **fresh** wallet for this; never reuse
     a key that has ever been pasted into a chat or committed anywhere)
3. Fund the reward pool by sending ZTRO directly to the deployed contract address
   (plain `zentaro.transfer(dispenserAddress, amount)` from the token holder), then
   optionally call `notifyFunded(amount)` for an on-chain log entry.
4. Fund the relayer wallet itself with a small amount of native BNB — it pays gas for
   every `reward()` call.
5. Set `ZTRO_REWARD_CONTRACT_ADDRESS` in the backend `.env` to the deployed address.
