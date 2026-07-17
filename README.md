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

## Status

현재까지 구현된 범위: 프로젝트 뼈대, 메인 페이지(Hero~Footer), 메인 메뉴 전체 라우팅 스켈레톤,
JWT 인증 + Wallet 조회 + AP 기반 Mall 결제(백엔드). 관리자 패널, NFT/Ticket 발급 로직,
텔레그램/결제/오퍼월 등 aim119의 다른 봇 서비스 연동은 아직 포함되어 있지 않습니다.
