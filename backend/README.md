# eKoolie Backend

Express + MongoDB/Mongoose API for the eKoolie railway-porter booking platform. Matches travellers to nearby porters using geospatial queries and an aggregation-based assignment pipeline.

## Structure

```
backend/
├── server.js                 # App entry: middleware, DB connect, route mount, error handler
├── config/database.js        # Mongoose connection
├── models/                   # Porter, Booking, Station schemas + indexes
├── controllers/               # Request handlers (business logic)
├── routes/                   # index.js mounts porter/booking/station routers
├── middleware/                # asyncHandler, errorHandler
├── data/seedData.js          # Sample data seeding
├── scripts/                  # Standalone scripts + MongoDB playgrounds
└── docs/                     # Extended reference docs (API examples, architecture, MongoDB concepts)
```

## Setup

```bash
cd backend
npm install
cp .env.example .env   # set MONGODB_URI and PORT
npm run seed           # populates stations, porters, sample bookings
npm run dev            # nodemon, or `npm start` for production
```

Server runs at `http://localhost:${PORT}` (default 5000; local dev typically uses 5001 — check `.env`).

## API Reference

### Health & docs
| Method | Endpoint | |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api` | Full endpoint reference (JSON) |

### Porters
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/porters` | Register a porter |
| POST | `/api/porters/login` | Porter login |
| GET | `/api/porters` | List porters (`station`, `isAvailable`, `minRating`) |
| GET | `/api/porters/:id` | Get porter by id |
| POST | `/api/porters/:id/skills` | Add skill (`$addToSet`) |
| DELETE | `/api/porters/:id/skills` | Remove skill (`$pull`) |
| GET | `/api/porters/filter/by-skill?skills=a,b` | Porters matching any skill (`$in`) |
| PATCH | `/api/porters/:id/availability` | Toggle availability |
| PATCH | `/api/porters/:id/stats` | Increment jobs/earnings (`$inc`) |
| GET | `/api/porters/:id/bookings?status=` | Bookings for a porter |
| POST | `/api/porters/:id/bookings/:bookingId/accept` | Accept a request |
| POST | `/api/porters/:id/bookings/:bookingId/decline` | Decline a request |
| POST | `/api/porters/:id/bookings/:bookingId/complete` | Complete a job (requires payment settled) |

### Bookings
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/bookings` | Create an unassigned booking |
| POST | `/api/bookings/request` | Create a booking tied to a specific porter |
| GET | `/api/bookings` | List bookings (`station`, `status`, `userId`, `minWeight`, `maxWeight`, `assignedPorter`) |
| GET | `/api/bookings/:id` | Get booking by id |
| GET | `/api/bookings/nearest-porters?longitude=&latitude=` | Geospatial nearest-porter search (`$near`) |
| POST | `/api/bookings/:bookingId/assign-best-porter` | Auto-assign via aggregation pipeline (`$geoNear` → `$match` → `$sort` → `$limit`) |
| POST | `/api/bookings/:bookingId/payment` | Mark booking as paid |
| POST | `/api/bookings/:bookingId/items` | Add an item (`$push`) |
| PATCH | `/api/bookings/:bookingId/status` | Update booking status |

### Stations
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/stations` | List stations (for dropdowns) |

## Notes

- Location fields are GeoJSON Points: `{ type: "Point", coordinates: [longitude, latitude] }` — longitude first.
- `$near` queries require the `2dsphere` index on `Porter.location` (created automatically from the schema).
- See `docs/` for detailed query examples and MongoDB concept explanations.
