const RailApiUsage = require("../models/RailApiUsage");

const MONTHLY_CAP = parseInt(process.env.RAILKIT_MONTHLY_CAP || "45", 10);

function currentMonthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Checks the current month's usage against the cap. A cap below the real
// 50/month free-tier limit leaves a buffer for anything already in flight.
async function canMakeCall() {
  const usage = await RailApiUsage.findById(currentMonthKey()).lean();
  return (usage?.count || 0) < MONTHLY_CAP;
}

// Only call this right before/after an actual upstream RailKit request —
// never on a cache hit or a mock response.
async function recordCall() {
  await RailApiUsage.findByIdAndUpdate(
    currentMonthKey(),
    { $inc: { count: 1 } },
    { upsert: true },
  );
}

module.exports = { canMakeCall, recordCall, MONTHLY_CAP };
