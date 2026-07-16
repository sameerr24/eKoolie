const mongoose = require("mongoose");

// One document per calendar month (_id = "2026-07"), incremented only on
// real upstream RailKit calls — never on cache hits or mock responses.
// This is the hard budget guard for the free tier's 50 requests/month.
const railApiUsageSchema = new mongoose.Schema({
  _id: { type: String }, // "YYYY-MM"
  count: { type: Number, default: 0 },
});

module.exports = mongoose.model("RailApiUsage", railApiUsageSchema);
