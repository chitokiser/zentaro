# zentaro

ZENTARO — 프리미엄 크래프트 증류소 웹 플랫폼 (진, 위스키, 리큐르 + Bottle Cap/NFT/Jump Token 리워드 생태계)

## Structure

- `frontend/` — Next.js 15(App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui(Radix 기반)
- `backend/` — NestJS + Firebase Admin SDK(Firestore) + JWT 인증

## Firebase

프론트/백엔드는 `aim119` Firebase 프로젝트(Firestore)를 다른 aim119 서비스들과 공유합니다.

- 공유 컬렉션: `users`(계정 + AP 포인트), `transactions`(AP 증감 원장)
- zentaro 전용 컬렉션: `zentaro_wallets`, `zentaro_products`, `zentaro_orders`, `zentaro_tickets`, `zentaro_nfts`

## Getting started

### Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in Firebase Admin SDK credentials
npm run seed:products  # seeds the 10 sample ZENTARO Mall products
npm run start:dev      # http://localhost:3001/api
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev             # http://localhost:3000
```

## Deployment

- **Frontend (Netlify)**: this repo is a monorepo (`frontend/` + `backend/`), so Netlify needs
  `netlify.toml` at the repo root (already committed) telling it the app lives in `frontend/`.
  In the Netlify site's dashboard, make sure **Site settings → Build & deploy → Base directory**
  is either unset or matches `frontend` — a conflicting UI override there beats `netlify.toml`.
  Set the env var `NEXT_PUBLIC_API_URL` to the deployed backend's URL (see below); without it,
  the site still renders but Mall/Wallet/login all silently fail since they'd be calling
  `localhost:3001`, which doesn't exist on Netlify's servers or any visitor's machine.
- **Backend (Railway or similar)**: the NestJS backend only runs on `localhost:3001` today — it
  isn't deployed anywhere public yet. Deploy `backend/` as its own service (Railway, Render,
  Fly.io, etc.), set the same env vars as `backend/.env.example`, then point the frontend's
  `NEXT_PUBLIC_API_URL` at that service's public URL and set `FRONTEND_URL` on the backend to
  the Netlify URL (for CORS).

## Mall 가격 정책

- **환율: 10,000 AP = 1 USD.** CJ Dropshipping 상품을 임포트할 때 `costAp`는
  `round(USD 하한가 × 10000, 100원 단위 반올림)`으로 계산하고, `priceAp = costAp × 2`
  (마진 100%)로 책정합니다.
- **드랍쉬핑 상품** (`fulfillmentType: 'dropshipping'`, CJ 소싱): 마진(`priceAp - costAp`)의
  **최대 80%까지 EXP로 결제 가능**, 나머지는 AP.
- **직배송/자체재고 상품** (`fulfillmentType: 'direct'`, 젠타로 자체 재고·세계 유명 주류): EXP 결제
  불가, **AP 100% 또는 현금 결제만 가능** (현금/PG 연동은 아직 미구현).
- 고객 화면에는 "마진의 N%" 같은 문구를 절대 노출하지 않는다 — EXP는 순수 쇼핑머니로만
  보여야 하며, 매장이 마진에서 생색내는 것처럼 보이면 안 됨.

## Status

현재까지 구현된 범위: 프로젝트 뼈대, 메인 페이지(Hero~Footer), 메인 메뉴 전체 라우팅 스켈레톤,
JWT 인증 + Wallet 조회 + AP 기반 Mall 결제(백엔드). 관리자 패널, NFT/Ticket 발급 로직,
텔레그램/결제/오퍼월 등 aim119의 다른 봇 서비스 연동은 아직 포함되어 있지 않습니다.
