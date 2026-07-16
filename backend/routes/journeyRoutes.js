const express = require("express");
const router = express.Router();
const journeyController = require("../controllers/journeyController");
const { requireAuth, requireRole } = require("../middleware/auth");

// Gated behind login so the (very limited) RailKit quota can't be spent by anonymous traffic.
router.post("/pnr", requireAuth, requireRole("traveller"), journeyController.lookupPnr);
router.post("/train-status", requireAuth, requireRole("traveller"), journeyController.lookupTrainStatus);

// Independent of RailKit (uses Nominatim), but kept behind the same gate to
// respect Nominatim's usage policy regardless of who's calling.
router.post("/geocode-station", requireAuth, requireRole("traveller"), journeyController.geocodeStation);

module.exports = router;
