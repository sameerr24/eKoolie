# eKoolie

eKoolie is a railway station porter booking platform — travellers book a verified porter to handle their luggage at Indian railway stations, track them live on a map once accepted, and pay online or in cash. It's a React (Vite) frontend backed by a real Express + MongoDB API, with real accounts, live GPS tracking, and a real (test-mode) payment gateway rather than any of it being simulated.

## Tech stack

**Frontend**
- React 19 + React Router 7 (SPA, client-side routing)
- Vite 8 (dev server + build)
- Leaflet 1.9 + OpenStreetMap tiles (live map rendering)
- Plain CSS, no UI framework

**Backend**
- Express 4 + Mongoose 7, MongoDB Atlas (cloud-hosted)
- JWT (`jsonwebtoken`) for auth, `bcryptjs` for password hashing
- `railkit` npm package — PNR lookup / live train status
- Razorpay npm SDK — payment gateway
- OpenStreetMap Nominatim (plain HTTP, no SDK) — station geocoding

## User flows

**Traveller**
1. Register or log in (real account, not just a name in localStorage).
2. On the booking page, either fill the form manually or enter a PNR — this auto-fills train/coach/station/arrival-time from live data.
3. Search nearby porters and send a request to one.
4. Land on a dedicated **Tracking** page immediately. Once the porter accepts and starts sharing their location, a live map appears.
5. Choose **Pay Now** or **Pay Later** — payment is never forced before you can see your porter (Uber-style, not a payment wall).
6. If paid later, you're prompted to pay once the porter marks the job complete.

**Porter**
1. Log in.
2. Dashboard shows incoming booking requests; accept or decline.
3. Toggle **Share my location** (off by default — explicit opt-in) while the job is active.
4. Mark the job complete — allowed regardless of payment status, since payment can happen before or after the job.

## Features and how they work

### 1. Authentication — JWT access + refresh tokens
Real traveller/porter accounts with bcrypt-hashed passwords replace the old "just type a name" flow. Two tokens are issued on login:
- **Access token** — short-lived (15 min), sent as an `Authorization: Bearer` header on every request, kept in memory + `localStorage`.
- **Refresh token** — longer-lived (7 days), stored in an `httpOnly` cookie so client-side JS can never read it (mitigates XSS token theft). Each use **rotates** it (issues a new one, invalidates the old) and it's tracked in a `RefreshToken` collection (hashed, TTL-indexed so expired ones clean themselves up) so a specific session can be revoked server-side — logging out actually invalidates that refresh token, not just "forget the token client-side."

The frontend (`src/api/client.js`) wraps every API call: if a request comes back `401 TOKEN_EXPIRED`, it silently calls `/auth/refresh`, retries the original request once, and only forces a logout if the refresh itself fails (meaning the refresh token is genuinely expired or revoked). Concurrent requests that all hit a 401 at once share a single in-flight refresh call rather than each firing their own. Backend routes are gated with `requireAuth` / `requireRole("traveller"|"porter")` / `requireSelf` middleware — the last one specifically closes a real gap where porter action endpoints used to trust a client-supplied `:id` with no check that it was actually *that* porter's session.

### 2. PNR lookup + live train status — RailKit
Rather than typing train number, coach, and station by hand, a traveller can enter their 10-digit PNR. The backend calls **RailKit** (a free-tier PNR/running-status API, capped at 50 requests/month) via its npm package. Because that quota is so small, it's protected on three sides:
- A cache (MongoDB, TTL-indexed — 20 min for PNR lookups, 10 min for live train status) so repeat lookups of the same PNR/train within the window cost zero extra requests.
- A hard monthly-quota counter (`RailApiUsage`) checked *before* every real call — if the month's budget is spent, the endpoint fails gracefully (`503`) and the traveller just falls back to filling the form manually, rather than the app breaking.
- A `RAILKIT_MOCK` env flag that returns realistic fake data in development, so the flow can be built and tested without spending real quota at all.

### 3. Station geocoding — OpenStreetMap Nominatim
The app ships with 10 seeded demo stations at fixed coordinates. If a PNR's destination isn't one of those 10, the backend resolves it via **Nominatim** (OpenStreetMap's free geocoding API, no key required) instead of failing outright. Nominatim's usage policy caps requests at roughly 1/second, so calls are serialized through an in-process queue; results are cached **permanently** (a station's coordinates never change), so the same station is only ever geocoded once across the app's whole lifetime.

### 4. Live GPS tracking — Leaflet, and HTTP polling instead of WebSockets
No WebSockets or Server-Sent Events here — the "live" updates are done with **HTTP polling**: the frontend simply asks the backend "what's the latest?" on a fixed timer instead of the server pushing updates over a persistent connection. Specifically:
- While a booking is in the tracking page, the frontend re-fetches booking status *and* the porter's location every **4 seconds**, on one shared timer (not two separate ones).
- On the porter's side, an explicit **"Share my location"** toggle (off by default — real consent, not silent tracking) starts `navigator.geolocation.watchPosition`, a browser API that calls back whenever the device's GPS position changes. Those callbacks are throttled in app code to send at most one location update every ~10 seconds, since `watchPosition` can fire far more often than that and there's no need to hammer the API for something moving at walking pace.

Polling is a deliberate, simple choice here: no persistent connections to manage, no extra infrastructure, and for something moving at foot/luggage-cart speed across a station platform, a few seconds of latency is invisible.

Maps are rendered with **Leaflet** (an open-source JS mapping library) using OpenStreetMap's tile servers — chosen specifically over the Google Maps JavaScript API to avoid Google Cloud's mandatory billing-account requirement. Leaflet needs no API key and no billing setup at all, which matters for a project still validating demand before spending money on infrastructure.

### 5. Dedicated tracking page + Pay Now / Pay Later
Booking used to force travellers straight to the payment page the moment a porter accepted, and the live map only lived inline on the booking page's status card. Both changed: there's now a dedicated `/tracking` page that becomes the home for a booking's status, live map, and payment choice, and the payment redirect is no longer forced — the traveller sees their porter's location immediately and can choose **Pay Now** (goes to the payment page right away) or **Pay Later** (proceeds with the job, prompted to pay again automatically once it's marked complete).

### 6. Secure Razorpay payment gateway
"Pay Now" goes through **Razorpay Standard Checkout** rather than a fake "mark as paid" button. The important part is what "secure" actually means here:
- The amount charged is computed **entirely server-side** from the booking's stored fare — never trusted from anything the client sends.
- Card/UPI details are entered inside Razorpay's own hosted popup and never touch this app's server at all, which keeps the app out of PCI-DSS scope.
- When the popup reports a successful payment, that report is **not** trusted by itself. The backend independently recomputes an HMAC-SHA256 signature (using Node's built-in `crypto`, compared with a timing-safe check) from the order ID and payment ID, using a secret key that only the server holds. Only if that signature matches does `paymentStatus` flip to `"paid"`.
- "Cash on Service" stays a simple manual confirmation — there's nothing to cryptographically verify about cash changing hands in person.

Razorpay was chosen specifically because it's the practical option for an India-based product — Stripe stopped onboarding new Indian merchants some years ago. **Test Mode** (used throughout development) needs no business KYC at all; going live later is just swapping two environment variables, no code changes.

## Routes (frontend)

| Path | Page |
|---|---|
| `/home` | Landing page |
| `/login` | Login / register (traveller or porter) |
| `/book` | Search for a porter and send a request |
| `/tracking` | Live status, map, and payment choice for the active booking |
| `/payment` | Razorpay checkout / cash confirmation |
| `/porter-profile` | Porter profile details |
| `/porter-dashboard` | Porter's job queue, accept/decline/complete, location sharing |

Old `.html` entry points (`/home.html`, `/book.html`, etc.) redirect to their React equivalents for backward compatibility.

## Environment variables

Two `.env` files, neither committed (see `.env.example` in each location for the full list with comments):

**Root `.env`** — just `VITE_API_BASE_URL` (defaults to routing through Vite's dev proxy at `/api`, or set to a deployed backend's full URL in production).

**`backend/.env`**:
| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Signing secrets for the two token types |
| `RAILKIT_API_KEY`, `RAILKIT_MOCK`, `RAILKIT_MONTHLY_CAP` | PNR/train-status lookups |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Payment gateway (Test Mode keys need no KYC) |
| `FRONTEND_URL` | Deployed frontend origin, for CORS + cookie handling in production |

## Running locally

**Backend:**
```bash
cd backend
npm install
cp .env.example .env   # fill in MONGODB_URI, JWT secrets, etc.
npm run seed           # populates demo stations, porters, sample bookings
npm run dev
```

**Frontend:**
```bash
npm install
npm run dev
```

## Deployment

- **Backend → Render**: `render.yaml` at the repo root defines the web service as a blueprint — connect the repo on Render, it auto-detects the file, and prompts for the secret env vars (`sync: false` entries) to fill in via the dashboard.
- **Frontend → Vercel**: `vercel.json` adds the SPA rewrite rule needed for client-side routes (`/book`, `/tracking`, etc.) to survive a direct load/refresh, since there's no server-side router. Set `VITE_API_BASE_URL` to the deployed backend's URL in Vercel's project settings.

Both should be pointed at the `new-version-updated-frontend-and-backend` branch, not `main`.
