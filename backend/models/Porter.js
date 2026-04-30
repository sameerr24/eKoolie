/**
 * PORTER (COOLIE) MODEL - DEMONSTRATING ADVANCED MONGODB CONCEPTS
 *
 * This schema showcases:
 * - GeoJSON for geospatial queries
 * - Multiple index strategies (2dsphere, single field, compound)
 * - Array operations ($push, $addToSet)
 * - Timestamps for audit trails
 */

const mongoose = require("mongoose");

/**
 * Porter Schema
 * Represents railway porters who can be booked for luggage transport
 */
const porterSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    station: {
      type: String,
      required: true,
      trim: true,
      // free-form station name (no enum) to allow seeding with multiple real stations
    },

    // Performance Metrics
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
    },
    totalJobs: {
      type: Number,
      default: 0,
    },

    // Availability Status
    isAvailable: {
      type: Boolean,
      default: true,
      // Index on isAvailable for quick availability filtering
    },

    // Physical Capacity
    maxLoad: {
      type: Number, // in kg
      required: true,
      min: 10,
      max: 100,
    },

    /**
     * GEOSPATIAL DATA: GeoJSON Point
     *
     * Format: {
     *   type: 'Point',
     *   coordinates: [longitude, latitude]
     * }
     *
     * IMPORTANT: Always use [longitude, latitude] order per GIS standards
     * This enables $near, $geoWithin, and $nearSphere queries
     *
     * Example: Mumbai Central Station
     * coordinates: [72.8247, 18.9676]
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

    /**
     * ARRAY OPERATIONS EXAMPLE
     *
     * Demonstrates $push and $addToSet operators:
     * - Use $push to add with duplicates
     * - Use $addToSet to maintain unique values
     * - Can query array elements with dot notation
     *
     * Example query: { skills: 'heavy luggage' }
     */
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

    // Performance History
    earnings: {
      type: Number,
      default: 0,
    },
    completedBookings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  },
);

/**
 * ========================================
 * INDEXES - CRITICAL FOR PERFORMANCE
 * ========================================
 */

/**
 * 1. GEOSPATIAL INDEX (2dsphere)
 *
 * Purpose:
 * - Enables $near, $geoWithin, $nearSphere queries
 * - Allows finding porters near a given location
 * - Must be on GeoJSON Point field
 *
 * Use Case: "Find 5 nearest available porters to user's location"
 *
 * Query Example:
 * db.porters.find({
 *   location: {
 *     $near: {
 *       $geometry: { type: 'Point', coordinates: [72.8247, 18.9676] },
 *       $maxDistance: 5000  // 5km
 *     }
 *   }
 * })
 */
porterSchema.index({ location: "2dsphere" });

/**
 * 2. SINGLE FIELD INDEX (station)
 *
 * Purpose:
 * - Speeds up equality queries on station field
 * - Useful for filtering by station
 *
 * Use Case: "Find all porters in Central Station"
 *
 * Query Example:
 * db.porters.find({ station: 'Central Station' })
 */
porterSchema.index({ station: 1 });

/**
 * 3. COMPOUND INDEX (station + isAvailable)
 *
 * Purpose:
 * - Optimizes queries filtering by both station AND isAvailable
 * - Index key order matters: queries should match index order
 * - Reduces need for multiple indexes
 *
 * Use Case: "Find all available porters in Central Station"
 *
 * Query Example:
 * db.porters.find({ station: 'Central Station', isAvailable: true })
 */
porterSchema.index({ station: 1, isAvailable: 1 });

/**
 * 4. COMPOSITE INDEX (rating + isAvailable) for sorting
 *
 * Purpose:
 * - Enables efficient sorting by rating for available porters
 * - Useful in aggregation pipelines
 *
 * Use Case: "Find best-rated available porters"
 */
porterSchema.index({ isAvailable: 1, rating: -1 });

/**
 * 5. GEOSPATIAL + AVAILABILITY COMPOUND INDEX
 *
 * Purpose:
 * - Combines geospatial search with availability filter
 * - Optimizes: location ($near) + isAvailable filter
 *
 * Note: When using 2dsphere in compound index, it must be the first field
 */
porterSchema.index({ location: "2dsphere", isAvailable: 1 });

module.exports = mongoose.model("Porter", porterSchema);
