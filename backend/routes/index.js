const express = require("express");
const router = express.Router();

const porterRoutes = require("./porterRoutes");
const bookingRoutes = require("./bookingRoutes");
const stationRoutes = require("./stationRoutes");
const bookingController = require("../controllers/bookingController");

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
router.post("/bookings/request", bookingController.createBookingRequest);

router.use("/stations", stationRoutes);

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
        },
        bookings: {
          "POST /api/bookings": "Create new booking",
          "POST /api/bookings/request": "Request a specific porter",
          "GET /api/bookings": "Get all bookings (with filters)",
          "GET /api/bookings/:id": "Get booking by ID",
          "GET /api/bookings/nearest-porters": "Find nearest porters (geospatial)",
          "POST /api/bookings/:bookingId/assign-best-porter": "Assign best porter (aggregation)",
          "POST /api/bookings/:bookingId/payment": "Mark booking as paid",
          "POST /api/bookings/:bookingId/items": "Add item to booking",
          "PATCH /api/bookings/:bookingId/status": "Update booking status",
        },
        stations: {
          "GET /api/stations": "List stations for dropdowns",
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
