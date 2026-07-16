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

    // Razorpay order/payment IDs — audit trail for support/debugging, only
    // ever set after server-side signature verification (paymentController.js)
    paymentOrderId: { type: String, default: null },
    paymentId: { type: String, default: null },

    specialRequests: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, default: null },

    // Live in-transit position while a job is active — distinct from the
    // porter's static Porter.location (their registered profile location).
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    locationUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

bookingSchema.index({ status: 1 });
bookingSchema.index({ userId: 1, status: 1 }); // "this user's pending bookings"
bookingSchema.index({ assignedPorter: 1 }); // "this porter's bookings"
bookingSchema.index({ station: 1, status: 1 }); // "pending bookings at this station"

// Auto-remove stale unresolved bookings 24h after creation. The real
// traveller-facing flow (createBookingRequest) creates bookings directly as
// "requested", never "pending" — "pending" only exists for the older
// createBooking+assignBestPorter path — so both are covered here; otherwise
// a request a porter never responds to would sit in the DB forever.
bookingSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 86400, partialFilterExpression: { status: { $in: ["pending", "requested"] } } },
);

module.exports = mongoose.model("Booking", bookingSchema);
