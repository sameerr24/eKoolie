const mongoose = require("mongoose");

// Traveller account — real, verifiable identity for booking (replaces the
// old localStorage-only "login").
const travellerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Traveller", travellerSchema);
