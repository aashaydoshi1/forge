# Forge

**AI-powered fitness tracking and coaching for mobile.**

Forge is a React Native app that helps athletes plan workouts, log training sessions, and message an in-app AI Coach from a single mobile experience. It connects authentication, weekly scheduling, workout history, and a Coach chat screen to a Supabase backend — so training data stays with the user across sessions instead of living in disconnected notes or generic fitness trackers.

Built as a production-minded Expo project with real device testing, deep-link auth flows, and platform-specific mobile engineering (especially Android).

---

## Project Highlights

Features that are implemented today:

- **Authentication with Supabase** — email/password sign-up, sign-in, and password recovery wired to Supabase Auth
- **Secure session persistence** — on-device session storage via Secure Store (with a safe fallback path when Secure Store is unavailable)
- **Workout creation and scheduling** — create plans, assign them to days of the week, and manage rest vs training days
- **Workout logging** — start sessions, log sets, and review completed workout history
- **AI Coach chat** — Coach tab UI that sends messages to a Supabase `ai-coach` Edge Function; replies use the user’s profile context when the function is deployed with its API secret
- **Mobile-first React Native experience** — Expo Router navigation, NativeWind UI, and Dev Client builds tested on a physical Android device

---

## Demo

> Screenshots and a short walkthrough will be added here for portfolio review.

### App screenshots

| Home | Workouts | Schedule | Coach | Progress |
|------|----------|----------|-------|----------|
| ![Home screenshot placeholder](docs/demo/home.png) | ![Workouts screenshot placeholder](docs/demo/workouts.png) | ![Schedule screenshot placeholder](docs/demo/schedule.png) | ![Coach screenshot placeholder](docs/demo/coach.png) | ![Progress screenshot placeholder](docs/demo/progress.png) |

*Add PNG/WebP captures to `docs/demo/` using the filenames above.*

### Demo video / GIF

<!-- Replace with an embedded GIF or link when available -->

**Demo video:** _Coming soon_ — place a short recording at `docs/demo/forge-demo.gif` or link an unlisted YouTube/Loom walkthrough here.

Suggested clip (30–60s): sign in → open today’s workout → log a set → assign a schedule day → ask the Coach a question.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| App framework | **Expo SDK 54** (`expo ~54.0.0`) + **React Native** |
| Language | **TypeScript** |
| Navigation | **Expo Router** (file-based routes, auth groups) |
| Styling | **NativeWind** (Tailwind CSS for React Native) |
| Backend | **Supabase** (Auth, Postgres, RLS, Edge Functions) |
| Client state | **Zustand** |
| Server state | **TanStack React Query** |
| Forms / validation | **React Hook Form** + **Zod** |
| Native builds | **EAS Build** + **expo-dev-client** |

---

## Architecture

Forge keeps routes thin and pushes domain logic into `src/`.

### Expo Router navigation

- `app/(auth)/` — welcome, login, signup, forgot password, email-verified
- `app/(onboarding)/` — profile setup for new accounts
- `app/(app)/` — authenticated experience (tabs + workout flows)

### Auth route protection

Root navigation uses Expo Router route guards so signed-out users stay in `(auth)`, users without a profile go through onboarding, and fully set-up users reach `(app)`.

### Supabase backend

- Postgres tables for profiles, workout plans, schedules, sessions, completed sets, and chat messages
- Row Level Security so users only access their own data
- Edge Function (`ai-coach`) proxies Coach chat requests server-side (API keys stay off the device)

### Zustand state management

Used for client/UI session concerns such as auth store helpers and in-progress workout session state.

### React Query server state

Wraps remote reads/mutations with caching and refetch behavior for Supabase-backed data.

### Component-based structure

```text
app/                    # Expo Router screens (thin — limited business logic)
  (auth)/               # Public auth flows
  (onboarding)/         # First-time profile setup
  (app)/                # Protected tabs + workout screens
src/
  components/           # Shared UI and layout (screens, keyboard helpers, inputs)
  features/             # Domain modules (e.g. auth context)
  lib/                  # Supabase client, queries, workout/schedule helpers
  stores/               # Zustand stores
  providers/            # App-wide providers (React Query, auth)
  config/               # Typed environment config
  theme/                # Design tokens
supabase/
  migrations/           # SQL schema + RLS
  functions/            # Edge Functions (ai-coach)
```

---

## Engineering Challenges Solved

Real mobile and backend issues addressed during development:

| Challenge | What was involved |
|-----------|-------------------|
| **Supabase auth + email verification deep linking** | Confirmation redirects into the app via `forge://email-verified`, with correct redirect URL configuration so verification does not leave users on a broken web/session path |
| **Session persistence and refresh handling** | Secure on-device storage for Supabase sessions, including environments where Secure Store is unavailable |
| **Android Dev Client setup** | Moved beyond Expo Go to `expo-dev-client` + EAS development profiles so native modules (Secure Store, splash, etc.) work on a real Android device |
| **Android edge-to-edge keyboard handling** | Shared keyboard-aware layouts so form inputs and the Coach composer stay visible above the IME when window resize alone is unreliable |
| **Android bottom tab navigation** | Fixed tab bar height under edge-to-edge safe areas and restored visible tab icons on Android without changing iOS appearance |
| **Schedule state / UI logic bugs** | Corrected day-card action labeling so Edit/Rest behavior matches assigned workouts instead of hard-coded day exceptions |

---

## Development Process

Forge was built iteratively as a real mobile product, not a single demo screen:

- Developed with **React Native + Expo (SDK 54)** and TypeScript
- Validated on a **physical Android device** using EAS Dev Client builds
- Tracked work with **Git / GitHub** (feature branches, iterative fixes)
- Debugged platform-specific issues (keyboard, tabs, deep links, splash, env for EAS) against device behavior rather than simulator-only assumptions

---

## Roadmap

Planned improvements (not claimed as complete):

| Area | Planned work |
|------|----------------|
| **AI coach expansion** | Richer coaching context, stronger conversation memory, and more training-aware replies |
| **Progress analytics** | Deeper strength/volume trends beyond the current Progress tab summaries |
| **Exercise library improvements** | Broader exercise catalog and faster plan building |
| **Notifications** | Training reminders and schedule nudges (`expo-notifications` is installed; product flows are not shipped yet) |
| **Production release** | Store listing polish, production EAS profiles, and App Store / Play submission |

---

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 20 LTS or newer
- [Git](https://git-scm.com/)
- A [Supabase](https://supabase.com/) project (free tier works for development)
- An Android device/emulator or iOS simulator

Optional (recommended for native modules and release builds):

- [EAS CLI](https://docs.expo.dev/build/setup/): `npm install -g eas-cli`
- [Supabase CLI](https://supabase.com/docs/guides/cli): available via `npx supabase`

> Forge targets **expo-dev-client**. Expo Go may not support all native modules used by this project.

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

> The app can boot without Supabase configured, but auth and data features stay disabled until valid credentials are provided.

### 3. Set up Supabase

Apply migrations (profiles, workouts, schedules, history, chat, etc.):

```bash
npx supabase login
npx supabase link --project-ref your-project-id
npx supabase db push
```

Or run the SQL files under `supabase/migrations/` in the Supabase SQL editor.

### 4. Email confirmation redirect

After signup, confirmation should open the in-app success screen (`forge://email-verified`).

In Supabase Dashboard → **Authentication → URL Configuration**, add Redirect URL:

```text
forge://email-verified
```

Override with `EXPO_PUBLIC_EMAIL_REDIRECT_URL` only if you host a custom HTTPS confirmation page.

### 5. Start the development server

```bash
npm start
```

Then connect from the installed Forge Dev Client (same Wi‑Fi), or use:

```bash
npm run android
npm run ios
npm run web
```

### Available scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the Expo dev server (Dev Client) |
| `npm run android` | Start with Android Dev Client target |
| `npm run ios` | Start with iOS Dev Client target |
| `npm run web` | Start in the browser |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run build:dev:android` | EAS Android development build |
| `npm run build:dev:android:device` | EAS Android device development build |
| `npm run build:preview:android` | EAS Android preview build |

---

## Development builds (Expo Dev Client)

Forge uses **expo-dev-client** (not Expo Go) for native module support (Secure Store, splash, etc.).

| EAS profile | Purpose |
|-------------|---------|
| `development` | Dev Client — Android APK + iOS Simulator |
| `development-device` | Dev Client — Android device APK |
| `preview` / `production` | Release builds |

Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` exist in the matching EAS environment before building.

### Install the Dev Client (Android)

```bash
eas login
eas build --platform android --profile development
```

When the build finishes, install the APK from the Expo dashboard (or use `eas build:run -p android --latest`).

JS/TS changes reload live. Native changes (plugins, `app.config.ts`, new native deps) need a new Dev Client build.

### Required public env vars (EAS)

`EXPO_PUBLIC_*` values are inlined into the JS bundle at build time. They are **not secrets**, but they must exist on EAS — a local `.env` is not uploaded to cloud builds.

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

Then rebuild (`eas build --profile development` or `preview`). Local `.env` remains for `npm start` only.

> Use **plaintext** (or sensitive) visibility — not `secret`. Secret vars are not available to Metro when inlining `EXPO_PUBLIC_*` into the app.

---

## License

See [LICENSE](LICENSE).
