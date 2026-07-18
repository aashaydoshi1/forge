# Forge

AI-powered fitness tracking and coaching app built with React Native, Expo, Supabase, and AI.

## Tech Stack

- **Expo** (SDK 57) + **React Native**
- **TypeScript**
- **Expo Router** — file-based navigation with auth route groups
- **NativeWind** — Tailwind CSS styling for React Native
- **Supabase** — auth, database, storage, edge functions
- **Zustand** — client-side UI state
- **React Query** — server state and caching

## Prerequisites

- [Node.js](https://nodejs.org/) 20 LTS or newer
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go) on your phone (for quick local testing), or an iOS/Android simulator
- A [Supabase](https://supabase.com/) project (free tier works for development)

Optional (for production builds and Supabase CLI):

- [EAS CLI](https://docs.expo.dev/build/setup/): `npm install -g eas-cli`
- [Supabase CLI](https://supabase.com/docs/guides/cli): installed as a dev dependency (`npx supabase`)

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/aashaydoshi1/forge.git
cd forge
npm install
```

### 2. Configure environment variables

Copy the example env file and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
APP_ENV=development
```

Find these values in the Supabase dashboard under **Project Settings → API**.

> The app runs without Supabase configured, but auth and data features will be disabled until valid credentials are provided.

### 3. Set up Supabase (optional for Phase 0)

Apply the initial database migration to create the `profiles` table with Row Level Security:

```bash
npx supabase login
npx supabase link --project-ref your-project-id
npx supabase db push
```

Or run the SQL in `supabase/migrations/20260715000000_create_profiles.sql` manually in the Supabase SQL editor.

### 4. Start the development server

```bash
npm start
```

Then:

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan the QR code with Expo Go on your device

Other run targets:

```bash
npm run ios
npm run android
npm run web
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the Expo dev server |
| `npm run ios` | Start on iOS simulator |
| `npm run android` | Start on Android emulator |
| `npm run web` | Start in the browser |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |

## Project Structure

```
app/                    # Expo Router routes (thin — no business logic)
  (auth)/               # Public routes: welcome, sign-in, sign-up
  (app)/                # Protected routes: tab navigation
src/
  components/           # Shared UI and layout components
  features/             # Domain modules (auth, workouts, etc.)
  lib/                  # Supabase client, React Query, utilities
  stores/               # Zustand stores
  providers/            # App-wide context providers
  config/               # Typed environment config
  theme/                # Design tokens
supabase/
  migrations/           # SQL schema and RLS policies
  functions/            # Edge Functions (AI proxy, etc.)
```

## Authentication

Forge uses **Supabase Auth** with email and password. Sessions are persisted securely on-device via `expo-secure-store`. Login stays in the mobile app only.

Route groups enforce access:

- `(auth)` — visible when signed out
- `(app)` — visible when signed in

### Email confirmation

After signup, confirmation opens the in-app success screen (`forge://email-verified`) — no web session.

In Supabase Dashboard → **Authentication → URL Configuration**, add Redirect URL:
`forge://email-verified`

Override with `EXPO_PUBLIC_EMAIL_REDIRECT_URL` only if you host a custom HTTPS confirmation page.

## Development builds (Expo Dev Client)

Forge uses **expo-dev-client** (not Expo Go) for native module support (SecureStore, splash, etc.).

EAS profiles:

| Profile | Purpose |
|---------|---------|
| `development` | Dev Client — Android APK + iOS Simulator |
| `development-device` | Dev Client — Android device APK |
| `preview` / `production` | Release builds (unchanged) |

Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` exist in the EAS **development** environment before building.

### Install the Dev Client (Android device/emulator)

```bash
eas login
eas build --platform android --profile development
```

When the build finishes, install the APK from the Expo dashboard link (or scan the QR / use `eas build:run -p android --latest`).

### Start live development

```bash
npm start
```

Open the installed Forge Dev Client and connect to the bundler (same Wi‑Fi, or press `a` / scan the QR in the terminal).

JS/TS changes reload live. Native changes (plugins, `app.config.ts`, new native deps) need a new Dev Client build.

### Required public env vars (EAS)

`EXPO_PUBLIC_*` values are inlined into the JS bundle at build time. They are **not secrets**, but do **not** put them only in a local `.env` — that file is not uploaded to EAS.

Create these on EAS for each environment you build (`development`, `preview`, `production`):

```bash
# Replace values with your Supabase Project URL + anon (public) key
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_PROJECT_REF.supabase.co" --environment development --visibility plaintext
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY" --environment development --visibility plaintext

eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_PROJECT_REF.supabase.co" --environment preview --visibility plaintext
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY" --environment preview --visibility plaintext

eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_PROJECT_REF.supabase.co" --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY" --environment production --visibility plaintext
```

Or add them in the Expo dashboard: **Project → Environment variables**.

Then rebuild the APK (`eas build --profile development` or `preview`). Local `.env` remains for `npx expo start` only.

> Use **plaintext** (or sensitive) visibility — not `secret`. Secret vars are not available to Metro when inlining `EXPO_PUBLIC_*` into the app.

## Development Phases

| Phase | Status | Focus |
|-------|--------|-------|
| **0** | Complete | Project scaffolding, routing, providers, Supabase wiring |
| **1** | Planned | Auth screens, profile creation, RLS |
| **2** | Planned | Exercise library, manual workout logging |
| **3** | Planned | AI coach (Edge Function + chat UI) |
| **4** | Planned | Programs, progress charts, push notifications |
| **5** | Planned | Polish, subscriptions, store submission |

## License

See [LICENSE](LICENSE).
