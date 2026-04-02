# Nexfin Exchange Frontend

Next.js App Router frontend for the crypto exchange backend in `../backend`.

## What is implemented

- App Router + TypeScript
- Feature-based frontend architecture under `src/modules`
- BFF layer under `src/app/api` for backend integration
- HTTP-only cookie session handling
- Trading workspace with:
  - ticker summary
  - live order book stream
  - live trades stream
  - order entry
  - open orders
- Wallet workspace with:
  - portfolio balances
  - mock deposits
  - withdrawals
  - deposit / withdrawal history
- Orders history page
- Settings / identity page
- Dark / light mode via `next-themes`
- React Query + Zustand + Axios + Zod
- Dockerfile and GitHub Actions CI

## Folder structure

```text
src/
  app/
  modules/
  components/
  lib/
  store/
  config/
  types/
  i18n/
```

## Required backend endpoints

This frontend expects the backend to expose:

- `GET /api/v1/auth/me`
- `GET /api/v1/market/symbols`
- `GET /api/v1/balance/portfolio`
- `GET /api/v1/wallet/deposits`
- `GET /api/v1/wallet/withdrawals`

Those endpoints were added in the paired backend pass.

## Environment

Copy `.env.example` into `.env.local` and adjust if needed.

```bash
cp .env.example .env.local
```

Default local backend:

- HTTP: `http://localhost:4000`
- WS: `ws://localhost:4000/ws`

## Run locally

```bash
npm ci
npm run dev
```

## Quality gates

```bash
npm run lint
npm run typecheck
npm run build
```

## Docker

```bash
docker build -t nexfin-frontend .
docker run --rm -p 3000:3000 --env-file .env.local nexfin-frontend
```
