const mongoose = require("mongoose");

// Caches a normalized live-running-status response per (train, date) so
// repeat checks don't spend another RailKit request. TTL index auto-cleans.
const trainStatusCacheSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true },
  journeyDate: { type: String, required: true }, // DD-MM-YYYY, as RailKit expects
  response: { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true },
});

trainStatusCacheSchema.index({ trainNumber: 1, journeyDate: 1 }, { unique: true });
trainStatusCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("TrainStatusCache", trainStatusCacheSchema);
