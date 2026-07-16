const asyncHandler = require("../middleware/asyncHandler");
const PnrLookupCache = require("../models/PnrLookupCache");
const TrainStatusCache = require("../models/TrainStatusCache");
const StationGeocode = require("../models/StationGeocode");
const { canMakeCall, recordCall } = require("../services/railkitQuota");
const {
  checkPNRStatus,
  trackTrain,
  normalizePnrResponse,
  normalizeTrainStatusResponse,
} = require("../services/railkitClient");
const { geocodeStation } = require("../services/nominatimClient");

const PNR_CACHE_TTL_MS = 20 * 60 * 1000;
const TRAIN_STATUS_CACHE_TTL_MS = 10 * 60 * 1000;

function rethrowCachedFailure(cached) {
  if (cached?.response?.failed) {
    const error = new Error(cached.response.error);
    error.status = 404;
    throw error;
  }
}

// POST /journey/pnr — { pnr }
exports.lookupPnr = asyncHandler(async (req, res) => {
  const { pnr } = req.body;
  if (!pnr || !/^\d{10}$/.test(pnr)) {
    return res.status(400).json({ error: "A 10-digit PNR number is required" });
  }

  const cached = await PnrLookupCache.findOne({ pnr }).lean();
  if (cached) {
    rethrowCachedFailure(cached);
    return res.json({ data: cached.response, cached: true });
  }

  if (!(await canMakeCall())) {
    return res.status(503).json({
      error: "Journey lookup is temporarily unavailable. Please enter your journey details manually.",
      code: "QUOTA_EXHAUSTED",
    });
  }

  // Recorded before the call, not after: RailKit's own quota is spent the
  // moment the request reaches them, regardless of whether this particular
  // PNR turns out to be found — a thrown "not found" must still count.
  await recordCall();

  let raw;
  try {
    raw = await checkPNRStatus(pnr);
  } catch (error) {
    // Cache the failure too (same TTL) so retrying an expired/bad PNR
    // doesn't spend another real request for an answer we already have.
    await PnrLookupCache.findOneAndUpdate(
      { pnr },
      { pnr, response: { failed: true, error: error.message }, expiresAt: new Date(Date.now() + PNR_CACHE_TTL_MS) },
      { upsert: true },
    );
    throw error;
  }

  const normalized = normalizePnrResponse(raw);
  await PnrLookupCache.findOneAndUpdate(
    { pnr },
    { pnr, response: normalized, expiresAt: new Date(Date.now() + PNR_CACHE_TTL_MS) },
    { upsert: true },
  );

  res.json({ data: normalized, cached: false });
});

// POST /journey/train-status — { trainNumber, journeyDate, destinationStation, destinationStationCode }
// destinationStationCode (e.g. "NDLS") is preferred when available — it's an
// exact match against RailKit's timeline, whereas the name can differ in
// formatting; destinationStation is the fallback when no code is known.
exports.lookupTrainStatus = asyncHandler(async (req, res) => {
  const { trainNumber, journeyDate, destinationStation, destinationStationCode } = req.body;
  if (!trainNumber || !journeyDate || !(destinationStation || destinationStationCode)) {
    return res
      .status(400)
      .json({ error: "trainNumber, journeyDate and a destination station (or code) are required" });
  }

  const cached = await TrainStatusCache.findOne({ trainNumber, journeyDate }).lean();
  if (cached) {
    rethrowCachedFailure(cached);
    return res.json({
      data: normalizeTrainStatusResponse(cached.response, destinationStationCode, destinationStation),
      cached: true,
    });
  }

  if (!(await canMakeCall())) {
    return res.status(503).json({
      error: "Live train status is temporarily unavailable. Please enter the arrival time manually.",
      code: "QUOTA_EXHAUSTED",
    });
  }

  await recordCall();

  let raw;
  try {
    raw = await trackTrain(trainNumber, journeyDate, destinationStationCode);
  } catch (error) {
    await TrainStatusCache.findOneAndUpdate(
      { trainNumber, journeyDate },
      {
        trainNumber,
        journeyDate,
        response: { failed: true, error: error.message },
        expiresAt: new Date(Date.now() + TRAIN_STATUS_CACHE_TTL_MS),
      },
      { upsert: true },
    );
    throw error;
  }

  await TrainStatusCache.findOneAndUpdate(
    { trainNumber, journeyDate },
    { trainNumber, journeyDate, response: raw, expiresAt: new Date(Date.now() + TRAIN_STATUS_CACHE_TTL_MS) },
    { upsert: true },
  );

  res.json({
    data: normalizeTrainStatusResponse(raw, destinationStationCode, destinationStation),
    cached: false,
  });
});

// POST /journey/geocode-station — { stationName }
// Independent of RailKit/its quota — this hits Nominatim (free), not RailKit.
// Cached permanently: a station's coordinates never change.
exports.geocodeStation = asyncHandler(async (req, res) => {
  const { stationName } = req.body;
  if (!stationName || !stationName.trim()) {
    return res.status(400).json({ error: "stationName is required" });
  }

  const query = stationName.trim().toLowerCase();
  const cached = await StationGeocode.findOne({ query }).lean();
  if (cached) {
    return res.json({
      data: { lat: cached.lat, lon: cached.lon, displayName: cached.displayName },
      cached: true,
    });
  }

  const result = await geocodeStation(stationName.trim());
  if (!result) {
    return res.status(404).json({ error: `Couldn't locate "${stationName}" on the map.` });
  }

  await StationGeocode.findOneAndUpdate(
    { query },
    { query, lat: result.lat, lon: result.lon, displayName: result.displayName },
    { upsert: true },
  );

  res.json({ data: result, cached: false });
});
