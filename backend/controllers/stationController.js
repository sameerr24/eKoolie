const Station = require("../models/Station");

/**
 * GET /api/stations
 * Return list of stations for frontend dropdowns
 */
async function getAllStations(req, res) {
  try {
    const stations = await Station.find(
      {},
      { name: 1, city: 1, location: 1 },
    ).sort({ city: 1, name: 1 });
    return res.json({ data: stations });
  } catch (err) {
    console.error("Error fetching stations:", err);
    return res.status(500).json({ error: "Failed to load stations" });
  }
}

module.exports = { getAllStations };
