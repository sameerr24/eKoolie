/**
 * BOOKING ROUTES
 *
 * All endpoints related to booking management
 */

const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const paymentController = require("../controllers/paymentController");
const { requireAuth, requireRole } = require("../middleware/auth");

const asTraveller = [requireAuth, requireRole("traveller")];

/**
 * POST /bookings
 * Create a new booking request
 */
router.post("/", ...asTraveller, bookingController.createBooking);

/**
 * POST /bookings/request
 * Create a booking request for a specific porter
 */
router.post("/request", ...asTraveller, bookingController.createBookingRequest);

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
router.get("/", requireAuth, bookingController.getAllBookings);

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
 * Get a specific booking by ID — the owning traveller or assigned porter only
 */
router.get("/:id", requireAuth, bookingController.getBookingById);

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
  ...asTraveller,
  bookingController.assignBestPorter,
);

/**
 * POST /bookings/:bookingId/payment
 * Mark a booking as paid — Cash on Service only (nothing to verify electronically)
 */
router.post("/:bookingId/payment", ...asTraveller, bookingController.markBookingAsPaid);

/**
 * POST /bookings/:bookingId/create-order
 * Create a Razorpay order for online payment (amount computed server-side)
 */
router.post("/:bookingId/create-order", ...asTraveller, paymentController.createOrder);

/**
 * POST /bookings/:bookingId/verify-payment
 * Verify a Razorpay payment signature and mark the booking paid
 */
router.post("/:bookingId/verify-payment", ...asTraveller, paymentController.verifyPayment);

/**
 * GET /bookings/:bookingId/location
 * Poll the assigned porter's live position for this booking
 */
router.get("/:bookingId/location", ...asTraveller, bookingController.getBookingLocation);

/**
 * POST /bookings/:bookingId/items
 * Add an item to booking (demonstrates $push array operation)
 */
router.post("/:bookingId/items", ...asTraveller, bookingController.addItemToBooking);

/**
 * PATCH /bookings/:bookingId/status
 * Update booking status
 * Valid statuses: pending, assigned, in_progress, completed, cancelled
 */
router.patch("/:bookingId/status", requireAuth, bookingController.updateBookingStatus);

/**
 * POST /bookings/:bookingId/cancel
 * Traveller withdraws their own request while it's still awaiting acceptance
 */
router.post("/:bookingId/cancel", ...asTraveller, bookingController.cancelBooking);

module.exports = router;
