const mongoose = require("mongoose");

// A traveller's porter booking: pickup details, lifecycle status, assigned
// porter reference, and the items being carried.
const bookingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userPhone: { type: String, required: true },
    station: { type: String, required: true, trim: true }, // free-form to allow seeded station names

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

    // requested -> pending -> assigned -> in_progress -> completed | cancelled
    status: {
      type: String,
      enum: ["requested", "pending", "assigned", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid"],
      default: "unpaid",
    },

    assignedPorter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Porter",
      default: null,
    },

    items: [
      {
        name: { type: String, required: true },
        weight: { type: Number, required: true, min: 0 }, // kg
        description: { type: String, default: "" },
      },
    ],
    totalWeight: { type: Number, default: 0 }, // derived from items, must be <= porter.maxLoad

    estimatedFare: { type: Number, required: true },
    actualFare: { type: Number, default: null },

    specialRequests: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, default: null },
  },
  { timestamps: true },
);

bookingSchema.index({ status: 1 });
bookingSchema.index({ userId: 1, status: 1 }); // "this user's pending bookings"
bookingSchema.index({ assignedPorter: 1 }); // "this porter's bookings"
bookingSchema.index({ station: 1, status: 1 }); // "pending bookings at this station"

// Auto-cancel stale pending bookings 24h after creation
bookingSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 86400, partialFilterExpression: { status: "pending" } },
);

module.exports = mongoose.model("Booking", bookingSchema);
