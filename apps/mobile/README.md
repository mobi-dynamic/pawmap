# PawMap mobile

Thin Expo + React Native shell for the new primary PawMap user surface.

## Current scope

This scaffold intentionally covers only the first navigation spine:

- API-backed search shell
- API-backed place detail shell
- API-backed report submission shell

It is still a thin slice, not a full product build.

## Local run

```bash
cd apps/mobile
cp .env.example .env
npm install
npm run dev
```

Then open the Expo QR/dev menu and run on iOS simulator, Android emulator, or Expo Go if compatible.

## Environment

Required env:

- `EXPO_PUBLIC_API_BASE_URL` — FastAPI base URL for mobile, for example `http://127.0.0.1:8000`
- `EXPO_PUBLIC_DEV_USER_ID` — local-dev UUID sent as `X-User-Id` for `POST /reports`

Do not put backend secrets such as `DATABASE_URL` in `apps/mobile/.env`. Keep database connection strings in the API environment only, for example `apps/api/.env` for local development.

Notes:

- On a simulator/emulator, `127.0.0.1` may need to be replaced with a LAN IP depending on how the API is running.
- Expo exposes `EXPO_PUBLIC_*` vars to the client app at build/runtime.

## Scripts

- `npm run dev` — start Expo dev server
- `npm run ios` — open iOS simulator
- `npm run android` — open Android emulator
- `npm run web` — preview with Expo web
- `npm run typecheck` — TypeScript validation

## Data-source note

The mobile app search/detail/report flows are API-backed now.

What can still look mock is the backend data source:

- if the API runs without `DATABASE_URL`, it falls back to the in-memory sample repository in `apps/api/app/repository.py`
- if the API runs with `DATABASE_URL` and only `python -m app.db bootstrap`, Postgres contains one stable sample place
- Google collection/ingestion commands can load geography-scoped sample snapshots or live Google-collected snapshots into Postgres

So "real API" does not automatically mean "live provider-backed search results".
