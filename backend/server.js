/**
 * ========================================
 * EKOOLIE BACKEND SERVER
 * ========================================
 *
 * Railway Porter Booking Platform
 * MongoDB-Focused Backend for College Evaluation
 *
 * Tech Stack:
 * - Node.js + Express.js
 * - MongoDB + Mongoose
 * - Geospatial Queries
 * - Aggregation Pipelines
 */

require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

// Import routes
const porterRoutes = require("./routes/porterRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const stationRoutes = require("./routes/stationRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * ========================================
 * MIDDLEWARE
 * ========================================
 */

// Enable CORS for React frontend
app.use(
  cors({
    origin: "http://localhost:5173", // Vite dev server
    credentials: true,
  }),
);

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

/**
 * ========================================
 * CONNECT TO DATABASE
 * ========================================
 */
connectDB();

/**
 * ========================================
 * API ROUTES
 * ========================================
 */

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running",
    database: "MongoDB connected",
    timestamp: new Date().toISOString(),
  });
});

// Porter routes
app.use("/api/porters", porterRoutes);

// Booking routes
app.use("/api/bookings", bookingRoutes);

// Station reference routes
app.use("/api/stations", stationRoutes);

/**
 * ========================================
 * ROOT ENDPOINT (API DOCUMENTATION)
 * ========================================
 */
app.get("/api", (req, res) => {
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
          "POST /api/porters/:id/bookings/:bookingId/accept":
            "Accept booking request",
          "POST /api/porters/:id/bookings/:bookingId/decline":
            "Decline booking request",
          "POST /api/porters/:id/bookings/:bookingId/complete":
            "Complete booking",
        },
        bookings: {
          "POST /api/bookings": "Create new booking",
          "POST /api/bookings/request": "Request a specific porter",
          "GET /api/bookings": "Get all bookings (with filters)",
          "GET /api/bookings/:id": "Get booking by ID",
          "GET /api/bookings/nearest-porters":
            "Find nearest porters (geospatial)",
          "POST /api/bookings/:bookingId/assign-best-porter":
            "Assign best porter (aggregation)",
          "POST /api/bookings/:bookingId/items": "Add item to booking",
          "PATCH /api/bookings/:bookingId/status": "Update booking status",
        },
      },
      mongoDB_features: {
        geospatial:
          "$near, $geoWithin, $geometry, $maxDistance (2dsphere index)",
        aggregation: "$geoNear, $match, $sort, $limit, $project",
        array_operations: "$push, $addToSet, $pull, $inc",
        filtering: "$gte, $lte, $in, $or, $and",
        indexing: "2dsphere, single-field, compound, TTL indexes",
      },
    },
  });
});

/**
 * ========================================
 * ERROR HANDLING
 * ========================================
 */

// 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

/**
 * ========================================
 * START SERVER
 * ========================================
 */

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║          EKOOLIE BACKEND SERVER STARTED                        ║
╠════════════════════════════════════════════════════════════════╣
║  Server:     http://localhost:${PORT}                           
║  API Docs:   http://localhost:${PORT}/api                       
║  Health:     http://localhost:${PORT}/api/health                
║                                                                ║
║  MongoDB Features Showcase:                                    ║
║  ✓ Geospatial Queries ($near, $geoWithin)                      ║
║  ✓ Aggregation Pipelines ($geoNear, $match, $sort)             ║
║  ✓ Array Operations ($push, $addToSet, $pull)                  ║
║  ✓ Advanced Indexes (2dsphere, compound)                       ║
║  ✓ Reference Population & Relationships                        ║
║                                                                ║
║  Ready to demonstrate MongoDB concepts for evaluation!         ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
