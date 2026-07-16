const express = require("express");
const router = express.Router();

const porterRoutes = require("./porterRoutes");
const bookingRoutes = require("./bookingRoutes");
const stationRoutes = require("./stationRoutes");
const travellerRoutes = require("./travellerRoutes");
const authRoutes = require("./authRoutes");
const journeyRoutes = require("./journeyRoutes");
const bookingController = require("../controllers/bookingController");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/health", (req, res) => {
  res.json({
    status: "Server is running",
    database: "MongoDB connected",
    timestamp: new Date().toISOString(),
  });
});

router.use("/porters", porterRoutes);
router.use("/bookings", bookingRoutes);

// Explicit alias kept alongside the router mount above: guarantees the
// porter-request flow still resolves even if the bookingRoutes mount above
// is ever replaced or cached during a restart.
router.post(
  "/bookings/request",
  requireAuth,
  requireRole("traveller"),
  bookingController.createBookingRequest,
);

router.use("/stations", stationRoutes);
router.use("/travellers", travellerRoutes);
router.use("/auth", authRoutes);
router.use("/journey", journeyRoutes);

// API reference
router.get("/", (req, res) => {
  res.json({
    project: "eKoolie - Railway Porter Booking Platform",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      documentation: {
        porters: {
          "POST /api/porters": "Add new porter",
          "POST /api/porters/login": "Login porter",
          "GET /api/porters": "Get all porters (with filters)",
          "GET /api/porters/:id": "Get porter by ID",
          "POST /api/porters/:id/skills": "Add skill to porter",
          "DELETE /api/porters/:id/skills": "Remove skill from porter",
          "PATCH /api/porters/:id/availability": "Update availability",
          "GET /api/porters/filter/by-skill": "Get porters by skill",
          "PATCH /api/porters/:id/stats": "Update porter stats",
          "GET /api/porters/:id/bookings": "Get porter bookings",
          "POST /api/porters/:id/bookings/:bookingId/accept": "Accept booking request",
          "POST /api/porters/:id/bookings/:bookingId/decline": "Decline booking request",
          "POST /api/porters/:id/bookings/:bookingId/complete": "Complete booking",
          "PATCH /api/porters/:id/bookings/:bookingId/location": "Push live location while a job is active",
        },
        bookings: {
          "POST /api/bookings": "Create new booking",
          "POST /api/bookings/request": "Request a specific porter",
          "GET /api/bookings": "Get all bookings (with filters)",
          "GET /api/bookings/:id": "Get booking by ID",
          "GET /api/bookings/nearest-porters": "Find nearest porters (geospatial)",
          "POST /api/bookings/:bookingId/assign-best-porter": "Assign best porter (aggregation)",
          "POST /api/bookings/:bookingId/cancel": "Cancel your own request before a porter accepts it",
          "POST /api/bookings/:bookingId/payment": "Mark booking as paid (Cash on Service only)",
          "POST /api/bookings/:bookingId/create-order": "Create a Razorpay order for online payment",
          "POST /api/bookings/:bookingId/verify-payment": "Verify a Razorpay payment signature",
          "GET /api/bookings/:bookingId/location": "Poll assigned porter's live location",
          "POST /api/bookings/:bookingId/items": "Add item to booking",
          "PATCH /api/bookings/:bookingId/status": "Update booking status",
        },
        stations: {
          "GET /api/stations": "List stations for dropdowns",
        },
        travellers: {
          "POST /api/travellers/register": "Register a traveller account",
          "POST /api/travellers/login": "Login as a traveller",
        },
        auth: {
          "POST /api/auth/refresh": "Exchange a valid refresh cookie for a new access token",
          "POST /api/auth/logout": "Revoke the current refresh token",
        },
        journey: {
          "POST /api/journey/pnr": "Look up journey details from a PNR (RailKit, cached, quota-limited)",
          "POST /api/journey/train-status": "Look up live running status / ETA for a train (RailKit, cached, quota-limited)",
          "POST /api/journey/geocode-station": "Resolve any station name to coordinates (Nominatim, cached permanently)",
        },
      },
      mongoDB_features: {
        geospatial: "$near, $geoWithin, $geometry, $maxDistance (2dsphere index)",
        aggregation: "$geoNear, $match, $sort, $limit, $project",
        array_operations: "$push, $addToSet, $pull, $inc",
        filtering: "$gte, $lte, $in, $or, $and",
        indexing: "2dsphere, single-field, compound, TTL indexes",
      },
    },
  });
});

module.exports = router;
