const mongoose = require("mongoose");

// Permanent cache — a physical station's coordinates never change, so once
// resolved via Nominatim we never need to look it up again. No TTL index.
const stationGeocodeSchema = new mongoose.Schema(
  {
    query: { type: String, required: true, unique: true }, // normalized lowercase station name
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    displayName: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StationGeocode", stationGeocodeSchema);
