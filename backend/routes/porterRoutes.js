/**
 * PORTER ROUTES
 *
 * All endpoints related to porter management
 */

const express = require("express");
const router = express.Router();
const porterController = require("../controllers/porterController");

/**
 * POST /porters
 * Add a new porter to the system
 */
router.post("/", porterController.addPorter);

/**
 * POST /porters/login
 * Login porter with username/password
 */
router.post("/login", porterController.loginPorter);

/**
 * GET /porters
 * Get all porters with optional filtering
 * Query parameters:
 * - station: Filter by station
 * - isAvailable: Filter by availability (true/false)
 * - minRating: Minimum rating (demonstrates $gte)
 */
router.get("/", porterController.getAllPorters);

/**
 * POST /porters/:id/skills
 * Add a skill to a porter (demonstrates $addToSet)
 */
router.post("/:id/skills", porterController.addSkill);

/**
 * GET /porters/:id
 * Get a specific porter by ID
 */
router.get("/:id", porterController.getPorterById);

/**
 * DELETE /porters/:id/skills
 * Remove a skill from a porter (demonstrates $pull)
 */
router.delete("/:id/skills", porterController.removeSkill);

/**
 * PATCH /porters/:id/availability
 * Update porter availability status
 */
router.patch("/:id/availability", porterController.updateAvailability);

/**
 * GET /porters/skill/:skill
 * Get all porters with a specific skill (demonstrates $in operator)
 */
router.get("/filter/by-skill", porterController.getPortersBySkill);

/**
 * PATCH /porters/:id/stats
 * Update porter statistics (demonstrates $inc)
 */
router.patch("/:id/stats", porterController.updatePorterStats);

/**
 * GET /porters/:id/bookings
 * Get porter bookings (optionally filtered by status)
 */
router.get("/:id/bookings", porterController.getPorterBookings);

/**
 * POST /porters/:id/bookings/:bookingId/accept
 * Accept a booking request
 */
router.post("/:id/bookings/:bookingId/accept", porterController.acceptBooking);

/**
 * POST /porters/:id/bookings/:bookingId/decline
 * Decline a booking request
 */
router.post(
  "/:id/bookings/:bookingId/decline",
  porterController.declineBooking,
);

/**
 * POST /porters/:id/bookings/:bookingId/complete
 * Complete an accepted booking
 */
router.post(
  "/:id/bookings/:bookingId/complete",
  porterController.completeBooking,
);

module.exports = router;
