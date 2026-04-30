/**
 * STATION MODEL - REFERENCE DATA
 *
 * Stores railway station information with coordinates
 * Used for geospatial queries and reference data
 */

const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
    },

    /**
     * Station location as GeoJSON Point
     * Enables geospatial queries for stations near user
     */
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    // Station capacity and metrics
    totalPlatforms: {
      type: Number,
      required: true,
    },
    activePorpers: {
      type: Number,
      default: 0,
    },
    peakHours: {
      type: [String], // e.g., ['07:00-09:00', '17:00-19:00']
      default: [],
    },

    // Contact information
    phone: String,
    email: String,
  },
  { timestamps: true },
);

/**
 * Indexes on Station
 */

// Geospatial index for finding nearby stations
stationSchema.index({ location: "2dsphere" });

// Index on city for quick city-based queries
stationSchema.index({ city: 1 });

// Compound index for finding active stations in a city
stationSchema.index({ city: 1, activePorpers: -1 });

module.exports = mongoose.model("Station", stationSchema);
