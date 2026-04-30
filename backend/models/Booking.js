/**
 * BOOKING MODEL - DEMONSTRATING ARRAY OPERATIONS AND REFERENCES
 *
 * This schema showcases:
 * - ObjectId references to Porter model
 * - Nested array of objects (items array)
 * - Enum for status validation
 * - Calculated fields (totalWeight)
 */

const mongoose = require("mongoose");

/**
 * Booking Schema
 * Represents a porter booking request
 */
const bookingSchema = new mongoose.Schema(
  {
    // User Information
    userId: {
      type: String,
      required: true,
    },
    userPhone: {
      type: String,
      required: true,
    },

    // Location Details
    station: {
      type: String,
      required: true,
      trim: true,
      // Allow free-form seeded station names (no enum)
    },

    /**
     * GEOSPATIAL DATA for pickup location
     * Same GeoJSON Point format as Porter model
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
     * STATUS ENUM
     *
     * Booking lifecycle:
     * 1. pending - waiting for porter assignment
     * 2. assigned - porter has been assigned
     * 3. in_progress - porter arrived at location
     * 4. completed - booking finished
     * 5. cancelled - booking was cancelled
     */
    status: {
      type: String,
      enum: [
        "requested",
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    /**
     * REFERENCE TO PORTER (ObjectId)
     *
     * Demonstrates Mongoose reference relationship
     * Use .populate() to fetch full Porter document
     *
     * Example:
     * await Booking.findById(id).populate('assignedPorter')
     */
    assignedPorter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Porter",
      default: null,
    },

    /**
     * NESTED ARRAY OF OBJECTS (Items)
     *
     * Demonstrates array operations:
     * - $push: Add new item
     * - $pull: Remove item by condition
     * - $set: Update array element
     *
     * Each item tracks what's being transported
     *
     * Example Documents:
     * items: [
     *   { name: 'Suitcase', weight: 15 },
     *   { name: 'Backpack', weight: 8 }
     * ]
     */
    items: [
      {
        name: {
          type: String,
          required: true,
        },
        weight: {
          type: Number, // in kg
          required: true,
          min: 0,
        },
        description: {
          type: String,
          default: "",
        },
      },
    ],

    /**
     * TOTAL LUGGAGE WEIGHT
     *
     * Calculated from items array
     * Must be <= Porter's maxLoad capacity
     */
    totalWeight: {
      type: Number,
      default: 0,
    },

    // Pricing
    estimatedFare: {
      type: Number,
      required: true,
    },
    actualFare: {
      type: Number,
      default: null,
    },

    // Additional Details
    specialRequests: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * INDEXES for Booking Model
 */

/**
 * 1. Index on status for quick filtering
 * Use Case: "Get all pending bookings"
 */
bookingSchema.index({ status: 1 });

/**
 * 2. Compound index: userId + status
 * Use Case: "Get user's pending bookings"
 */
bookingSchema.index({ userId: 1, status: 1 });

/**
 * 3. Index on assignedPorter (reference field)
 * Use Case: "Find all bookings for a specific porter"
 */
bookingSchema.index({ assignedPorter: 1 });

/**
 * 4. Index on station + status
 * Use Case: "Get pending bookings at Central Station"
 */
bookingSchema.index({ station: 1, status: 1 });

/**
 * 5. TTL Index for automatic cancellation of old pending bookings
 * Automatically removes documents 24 hours after creation if status is still 'pending'
 * MongoDB will scan this every 60 seconds (default TTL monitor)
 */
bookingSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 86400, // 24 hours
    partialFilterExpression: { status: "pending" },
  },
);

module.exports = mongoose.model("Booking", bookingSchema);
