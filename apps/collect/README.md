# MkulimaCollect — Developer Setup

## Prerequisites

- Node.js 22+
- pnpm 10+ or npm
- EAS CLI: `npm install -g eas-cli`
- Android Studio with Android SDK (API 26-35)
- Physical Android device or emulator (API 26+)

## Install Dependencies

```bash
cd apps/collect
npm install
```

## Run in Development (Expo Go — limited)

Note: MapLibre, camera, location, and SQLite require a development build. Expo Go is for UI-only testing only.

```bash
npm start
```

## Create Development Build (Required for Full Functionality)

```bash
# Login to EAS
eas login

# Create Android development build
eas build --profile development --platform android

# Install the resulting APK on your device/emulator
# Then start Metro:
npm start
```

## Run on Android Emulator (after dev build installed)

```bash
npm run android
```

## Run Tests

```bash
npm test
```

## Type Check

```bash
npm run typecheck
```

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `EXPO_PUBLIC_ENVIRONMENT=development` — uses LocalDevelopmentAdapter (mock data, no network)
- `EXPO_PUBLIC_MAP_TILE_SOURCE` — map tile URL for development

## Build Profiles

| Profile | Command | Output | Use |
|---|---|---|---|
| development | `eas build --profile development --platform android` | Debug APK | Local development |
| preview | `eas build --profile preview --platform android` | Release APK | Internal testing |
| production | `eas build --profile production --platform android` | AAB | Play Store / distribution |

## Architecture

See `.kiro/steering/` for architecture rules.
See `.kiro/specs/mkulimacollect-app/` for full specification.
