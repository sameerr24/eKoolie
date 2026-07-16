# eKoolie Backend

Express + MongoDB/Mongoose API for the eKoolie railway-porter booking platform. Matches travellers to nearby porters using geospatial queries, backs real JWT-based accounts, live GPS tracking, PNR/train-status lookups, and a Razorpay payment gateway.

## Structure

```
backend/
├── server.js                 # App entry: middleware, DB connect, route mount, error handler
├── config/database.js        # Mongoose connection
├── models/                   # Porter, Booking, Traveller, RefreshToken, Station,
│                              # PnrLookupCache, TrainStatusCache, StationGeocode, RailApiUsage
├── controllers/               # Request handlers (business logic)
├── routes/                   # index.js mounts every router below
├── middleware/                # asyncHandler, errorHandler, auth (requireAuth/requireRole/requireSelf)
├── services/                  # External integrations: tokenService, railkitClient, railkitQuota,
│                              # nominatimClient, razorpayClient
├── utils/                     # tokens.js (sign/verify JWTs), cookies.js (refresh-cookie helpers)
├── data/seedData.js          # Sample data seeding
├── scripts/                  # Standalone scripts + MongoDB playgrounds
└── docs/                     # Extended reference docs (API examples, architecture, MongoDB concepts)
```

## Setup

```bash
cd backend
npm install
cp .env.example .env   # see variables table below
npm run seed           # populates stations, porters, sample bookings
npm run dev            # nodemon, or `npm start` for production
```

Server runs at `http://localhost:${PORT}` (default 5000; local dev typically uses 5001 — check `.env`).

## Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `MONGODB_URI` | Everything | MongoDB Atlas (or local) connection string |
| `PORT`, `NODE_ENV` | Everything | `NODE_ENV=production` also switches cookie `secure`/`sameSite` behavior (see Concepts) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Auth | Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL` | Auth | Defaults: `15m` / `7d` |
| `RAILKIT_API_KEY`, `RAILKIT_MOCK`, `RAILKIT_MONTHLY_CAP` | PNR/train-status | Free tier is 50 req/month; `RAILKIT_MOCK=true` for cost-free dev |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Payments | Test Mode keys need no KYC/business docs |
| `FRONTEND_URL` | Production only | Deployed frontend origin, for CORS + cross-site cookie support |

## API Reference

### Health & docs
| Method | Endpoint | |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api` | Full endpoint reference (JSON) |

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/travellers/register` | — | Register a traveller account, returns an access token + sets the refresh cookie |
| POST | `/api/travellers/login` | — | Traveller login |
| POST | `/api/porters/login` | — | Porter login |
| POST | `/api/auth/refresh` | refresh cookie | Exchange a valid refresh cookie for a new access token (rotates it) |
| POST | `/api/auth/logout` | refresh cookie | Revoke the current refresh token |

### Porters
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/porters` | — | Register a porter |
| GET | `/api/porters` | — | List porters (`station`, `isAvailable`, `minRating`) |
| GET | `/api/porters/:id` | — | Get porter by id |
| GET | `/api/porters/filter/by-skill?skills=a,b` | — | Porters matching any skill (`$in`) |
| POST | `/api/porters/:id/skills` | self | Add skill (`$addToSet`) |
| DELETE | `/api/porters/:id/skills` | self | Remove skill (`$pull`) |
| PATCH | `/api/porters/:id/availability` | self | Toggle availability |
| PATCH | `/api/porters/:id/stats` | self | Increment jobs/earnings (`$inc`) |
| GET | `/api/porters/:id/bookings?status=` | self | Bookings for a porter |
| POST | `/api/porters/:id/bookings/:bookingId/accept` | self | Accept a request |
| POST | `/api/porters/:id/bookings/:bookingId/decline` | self | Decline a request |
| POST | `/api/porters/:id/bookings/:bookingId/complete` | self | Complete a job — allowed regardless of payment status (Pay Later support) |
| PATCH | `/api/porters/:id/bookings/:bookingId/location` | self | Push live GPS position while the job is active |

"self" = `requireAuth + requireRole("porter") + requireSelf("id")` — the authenticated porter can only act on their own account/bookings.

### Bookings
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/bookings` | traveller | Create an unassigned booking |
| POST | `/api/bookings/request` | traveller | Create a booking tied to a specific porter |
| GET | `/api/bookings` | — | List bookings (`station`, `status`, `userId`, `minWeight`, `maxWeight`, `assignedPorter`) |
| GET | `/api/bookings/:id` | — | Get booking by id |
| GET | `/api/bookings/nearest-porters?longitude=&latitude=` | — | Geospatial nearest-porter search (`$near`) |
| POST | `/api/bookings/:bookingId/assign-best-porter` | — | Auto-assign via aggregation pipeline (`$geoNear` → `$match` → `$sort` → `$limit`) |
| GET | `/api/bookings/:bookingId/location` | traveller (owner) | Poll the assigned porter's live position |
| POST | `/api/bookings/:bookingId/payment` | traveller (owner) | Mark booking paid — **Cash on Service only** |
| POST | `/api/bookings/:bookingId/create-order` | traveller (owner) | Create a Razorpay order (amount computed server-side) |
| POST | `/api/bookings/:bookingId/verify-payment` | traveller (owner) | Verify a Razorpay payment signature; only this can set `paymentStatus: "paid"` for online payments |
| POST | `/api/bookings/:bookingId/items` | — | Add an item (`$push`) |
| PATCH | `/api/bookings/:bookingId/status` | — | Update booking status |

### Journey (RailKit + Nominatim)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/journey/pnr` | traveller | Look up journey details from a 10-digit PNR |
| POST | `/api/journey/train-status` | traveller | Live running status / ETA for a train |
| POST | `/api/journey/geocode-station` | traveller | Resolve any station name to coordinates via Nominatim |

### Stations
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/stations` | List stations (for dropdowns) |

## Key concepts

### JWT access + refresh tokens
Login/register returns a short-lived **access token** (default 15 min) in the response body and sets a long-lived **refresh token** (default 7 days) as an `httpOnly` cookie scoped to `/api/auth`. The access token is stateless (verified via signature only); the refresh token is tracked server-side in the `RefreshToken` collection (hashed, never stored in plaintext) so a specific session can be revoked, and it **rotates** on every use — each `/auth/refresh` call issues a new refresh token and invalidates the one just used, limiting the damage if one ever leaks. A TTL index auto-deletes expired entries. In production (`NODE_ENV=production`), the cookie switches to `sameSite: "none"` + `secure: true`, since the frontend and backend live on different domains once deployed; in dev they're `"lax"` since everything's same-origin (or tunneled through one origin via the Vite proxy).

### HTTP polling instead of WebSockets
Booking status and live GPS location are both delivered by the client **polling** the server — a plain `GET` on a fixed interval (every 4 seconds) — rather than the server pushing updates over a persistent WebSocket/SSE connection. This is deliberately simple: no connection state to manage on the server, no extra infrastructure, and for something that changes on the order of seconds (a porter walking across a platform), the added latency of polling versus a push is invisible in practice.

### RailKit quota protection
RailKit's free tier caps out at 50 requests/month, so `journeyController.js` never calls it blindly:
1. Check a MongoDB cache first (`PnrLookupCache` / `TrainStatusCache`, TTL-indexed) — an identical query within the TTL window costs nothing.
2. Check a hard monthly counter (`RailApiUsage`) *before* calling RailKit — if the configured cap (`RAILKIT_MONTHLY_CAP`) is reached, the endpoint returns `503` instead of spending quota, and the frontend falls back to manual entry.
3. The counter increments **before** the call resolves, not after — a failed/thrown lookup still spent real quota against RailKit, and the counter has to reflect that.

`RAILKIT_MOCK=true` swaps in realistic fake responses so this whole flow can be built/tested without touching the real API at all.

### Nominatim rate limiting
Nominatim's usage policy allows roughly 1 request/second. `services/nominatimClient.js` serializes every call through an in-process promise queue that enforces a minimum interval between requests, and results are cached **permanently** in `StationGeocode` — a station's coordinates never change, so there's no TTL to expire.

### Razorpay signature verification
`paymentStatus` is only ever set to `"paid"` for an online payment inside `paymentController.verifyPayment`, and only after independently recomputing `HMAC-SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)` and comparing it (via `crypto.timingSafeEqual`, to avoid timing side-channels) against the signature Razorpay's checkout handed back to the client. The client reporting a successful payment is never itself trusted — a tampered or fabricated signature is rejected and the booking stays unpaid. The charged amount is likewise always derived server-side from `booking.estimatedFare`, never from anything the client sends in the request body.

### Geospatial queries
Location fields are GeoJSON Points: `{ type: "Point", coordinates: [longitude, latitude] }` — longitude first. `$near` (nearest-porter search) and `$geoNear` (in the auto-assign aggregation pipeline) both require the `2dsphere` index on `Porter.location`, created automatically from the schema. See `docs/` for detailed query examples and MongoDB concept explanations.
