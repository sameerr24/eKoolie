const express = require("express");
const router = express.Router();
const porterController = require("../controllers/porterController");
const { requireAuth, requireRole, requireSelf } = require("../middleware/auth");

const asPorterSelf = [requireAuth, requireRole("porter"), requireSelf("id")];

// Public: registration, login, and directory listings for the booking search flow
router.post("/", porterController.addPorter);
router.post("/login", porterController.loginPorter);
router.get("/", porterController.getAllPorters);
router.get("/filter/by-skill", porterController.getPortersBySkill);
router.get("/:id", porterController.getPorterById);

// Below: the authenticated porter may only act on their own account/bookings
router.post("/:id/skills", ...asPorterSelf, porterController.addSkill);
router.delete("/:id/skills", ...asPorterSelf, porterController.removeSkill);
router.patch("/:id/availability", ...asPorterSelf, porterController.updateAvailability);
router.patch("/:id/stats", ...asPorterSelf, porterController.updatePorterStats);
router.get("/:id/bookings", ...asPorterSelf, porterController.getPorterBookings);
router.post("/:id/bookings/:bookingId/accept", ...asPorterSelf, porterController.acceptBooking);
router.post("/:id/bookings/:bookingId/decline", ...asPorterSelf, porterController.declineBooking);
router.post("/:id/bookings/:bookingId/complete", ...asPorterSelf, porterController.completeBooking);
router.patch("/:id/bookings/:bookingId/location", ...asPorterSelf, porterController.updateBookingLocation);

module.exports = router;
