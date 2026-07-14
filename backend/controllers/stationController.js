const Station = require("../models/Station");
const asyncHandler = require("../middleware/asyncHandler");

// GET /stations — used by the frontend to populate station dropdowns
exports.getAllStations = asyncHandler(async (req, res) => {
  const stations = await Station.find({}, { name: 1, city: 1, location: 1 }).sort({
    city: 1,
    name: 1,
  });
  res.json({ data: stations });
});
