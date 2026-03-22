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

Notes:

- On a simulator/emulator, `127.0.0.1` may need to be replaced with a LAN IP depending on how the API is running.
- Expo exposes `EXPO_PUBLIC_*` vars to the client app at build/runtime.

## Scripts

- `npm run dev` — start Expo dev server
- `npm run ios` — open iOS simulator
- `npm run android` — open Android emulator
- `npm run web` — preview with Expo web
- `npm run typecheck` — TypeScript validation

## Next recommended implementation step

Replace the mock search/detail/report content with real API-backed data for:

1. `GET /places/search`
2. `GET /places/{placeId}`
3. `POST /reports`
