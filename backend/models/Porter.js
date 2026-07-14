const mongoose = require("mongoose");

// Porter (coolie) profile: identity/auth, availability, capacity, and
// GeoJSON location used for proximity search.
const porterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    station: { type: String, required: true, trim: true }, // free-form, not enum, to allow seeding real stations

    rating: { type: Number, default: 4.5, min: 1, max: 5 },
    totalJobs: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    maxLoad: { type: Number, required: true, min: 10, max: 100 }, // kg

    // GeoJSON Point, coordinates as [longitude, latitude] — required for $near/$geoNear
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

    skills: [
      {
        type: String,
        enum: [
          "heavy luggage",
          "VIP service",
          "fragile items",
          "express service",
          "wheelchair assist",
          "stair assistance",
        ],
      },
    ],

    earnings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Geospatial: powers $near / $geoNear proximity search
porterSchema.index({ location: "2dsphere" });
// Station lookups
porterSchema.index({ station: 1 });
// "Available porters at this station"
porterSchema.index({ station: 1, isAvailable: 1 });
// "Best-rated available porters", sorting-friendly
porterSchema.index({ isAvailable: 1, rating: -1 });
// Proximity search filtered by availability (2dsphere must lead a compound index)
porterSchema.index({ location: "2dsphere", isAvailable: 1 });

module.exports = mongoose.model("Porter", porterSchema);
