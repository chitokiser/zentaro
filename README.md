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

## Status

현재까지 구현된 범위: 프로젝트 뼈대, 메인 페이지(Hero~Footer), 메인 메뉴 전체 라우팅 스켈레톤,
JWT 인증 + Wallet 조회 + AP 기반 Mall 결제(백엔드). 관리자 패널, NFT/Ticket 발급 로직,
텔레그램/결제/오퍼월 등 aim119의 다른 봇 서비스 연동은 아직 포함되어 있지 않습니다.
