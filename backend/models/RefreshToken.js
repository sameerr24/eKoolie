const mongoose = require("mongoose");

// Stores hashed refresh tokens so sessions can be revoked (logout, rotation)
// instead of just relying on JWT expiry. TTL index auto-cleans expired rows.
const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, required: true },
  role: { type: String, enum: ["traveller", "porter"], required: true },
  expiresAt: { type: Date, required: true },
});

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
