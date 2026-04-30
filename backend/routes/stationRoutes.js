const express = require("express");
const router = express.Router();
const stationController = require("../controllers/stationController");

// GET /api/stations - list all stations
router.get("/", stationController.getAllStations);

module.exports = router;
