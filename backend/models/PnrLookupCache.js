const mongoose = require("mongoose");

// Caches a normalized PNR lookup response so repeat checks of the same PNR
// don't spend another RailKit request. TTL index auto-cleans expired rows.
const pnrLookupCacheSchema = new mongoose.Schema({
  pnr: { type: String, required: true, unique: true },
  response: { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true },
});

pnrLookupCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PnrLookupCache", pnrLookupCacheSchema);
