const mongoose = require("mongoose");

// Railway station reference data, used for dropdowns and geospatial queries.
const stationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    city: { type: String, required: true },

    // GeoJSON Point, coordinates as [longitude, latitude]
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    totalPlatforms: { type: Number, required: true },
    activePorpers: { type: Number, default: 0 },
    peakHours: { type: [String], default: [] }, // e.g. ["07:00-09:00", "17:00-19:00"]

    phone: String,
    email: String,
  },
  { timestamps: true },
);

stationSchema.index({ location: "2dsphere" });
stationSchema.index({ city: 1 });
stationSchema.index({ city: 1, activePorpers: -1 });

module.exports = mongoose.model("Station", stationSchema);
