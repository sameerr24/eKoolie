/**
 * BOOKING ROUTES
 *
 * All endpoints related to booking management
 */

const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

/**
 * POST /bookings
 * Create a new booking request
 */
router.post("/", bookingController.createBooking);

/**
 * POST /bookings/request
 * Create a booking request for a specific porter
 */
router.post("/request", bookingController.createBookingRequest);

/**
 * GET /bookings
 * Get all bookings with optional filtering
 * Query parameters:
 * - station: Filter by station
 * - status: Filter by status (pending, assigned, completed, etc.)
 * - userId: Filter by user ID
 * - minWeight: Minimum luggage weight (demonstrates $gte)
 * - maxWeight: Maximum luggage weight (demonstrates $lte)
 * - assignedPorter: Filter by assigned porter ID
 */
router.get("/", bookingController.getAllBookings);

/**
 * GET /bookings/nearest-porters
 * Find nearest available porters using geospatial query ($near)
 * Query parameters:
 * - longitude: User's longitude
 * - latitude: User's latitude
 * - maxDistance: Maximum distance in meters (default: 5000)
 * - station: Filter by station
 * - minCapacity: Minimum luggage capacity
 * - skill: Required skill (optional)
 * - limit: Number of results (default: 5)
 */
router.get("/nearest-porters", bookingController.findNearestPorters);

/**
 * GET /bookings/:id
 * Get a specific booking by ID
 */
router.get("/:id", bookingController.getBookingById);

/**
 * POST /bookings/:bookingId/assign-best-porter
 * Assign the best porter to a booking using aggregation pipeline
 *
 * CORE MONGODB FEATURE - Aggregation Pipeline:
 * - $geoNear: Find nearest porters
 * - $match: Filter by criteria
 * - $sort: Sort by rating
 * - $limit: Get top result
 */
router.post(
  "/:bookingId/assign-best-porter",
  bookingController.assignBestPorter,
);

/**
 * POST /bookings/:bookingId/payment
 * Mark a booking as paid after the user completes payment
 */
router.post("/:bookingId/payment", bookingController.markBookingAsPaid);

/**
 * POST /bookings/:bookingId/items
 * Add an item to booking (demonstrates $push array operation)
 */
router.post("/:bookingId/items", bookingController.addItemToBooking);

/**
 * PATCH /bookings/:bookingId/status
 * Update booking status
 * Valid statuses: pending, assigned, in_progress, completed, cancelled
 */
router.patch("/:bookingId/status", bookingController.updateBookingStatus);

module.exports = router;
