// Wraps the `railkit` SDK (PNR status + live train tracking). Behind
// RAILKIT_MOCK=true this returns realistic fixtures instead of calling out —
// that's how the whole PNR-lookup feature gets built/tested without
// spending any of the free tier's 50 requests/month. Field paths below were
// verified against real responses (see normalizePnrResponse /
// normalizeTrainStatusResponse) rather than guessed from docs alone.

const isMock = () => process.env.RAILKIT_MOCK !== "false";

let railkitModulePromise = null;
function loadRailkit() {
  // `railkit` is ESM-only ("type": "module"); this backend is CommonJS, so
  // it has to be loaded via dynamic import rather than require().
  if (!railkitModulePromise) {
    railkitModulePromise = import("railkit").then((mod) => {
      mod.configure(process.env.RAILKIT_API_KEY);
      return mod;
    });
  }
  return railkitModulePromise;
}

function mockPnrResponse(pnr) {
  return {
    success: true,
    data: {
      pnr,
      train: { number: "12951", name: "Mumbai Rajdhani Express" },
      journey: {
        dateOfJourney: "Jul 20, 2026 4:00:00 PM",
        class: "3A",
        source: { name: "Mumbai Central" },
        destination: { code: "NDLS", name: "New Delhi Station" },
      },
      chart: { status: "Chart Prepared" },
      passengers: [{ current: { coach: "B4", berthNo: 23, status: "CNF" } }],
    },
  };
}

function mockTrainStatusResponse(trainNumber, destinationStationCode) {
  const eta = new Date(Date.now() + 3 * 60 * 60 * 1000); // ~3h from now, for a realistic-looking fixture
  const etaStr = `${String(eta.getHours()).padStart(2, "0")}:${String(eta.getMinutes()).padStart(2, "0")} ${String(eta.getDate()).padStart(2, "0")}-${eta.toLocaleString("en-US", { month: "short" })}`;
  return {
    success: true,
    data: {
      trainNo: trainNumber,
      date: `${eta.getDate()}-${eta.toLocaleString("en-US", { month: "short" })}-${eta.getFullYear()}`,
      statusNote: "Running",
      lastUpdate: "5 min ago",
      timeline: [
        {
          stationCode: destinationStationCode || "DEST",
          stationName: "Destination",
          arrival: { scheduled: etaStr, actual: etaStr, delay: "18 min late" },
          departure: { scheduled: "DSTN", actual: "DSTN", delay: "" },
        },
      ],
    },
  };
}

// RailKit signals failure via `{ success: false, error: "..." }` rather than
// an HTTP error status, so a bad/expired PNR would otherwise come back as a
// "successful" response full of nulls. Surface it as a real error instead.
function throwIfUnsuccessful(raw) {
  if (raw?.success === false) {
    const error = new Error(raw.error || "Journey lookup failed");
    error.status = 404;
    throw error;
  }
  return raw;
}

async function checkPNRStatus(pnr) {
  if (isMock()) return mockPnrResponse(pnr);
  const railkit = await loadRailkit();
  return throwIfUnsuccessful(await railkit.checkPNRStatus(pnr));
}

async function trackTrain(trainNumber, journeyDate, destinationStationCode) {
  if (isMock()) return mockTrainStatusResponse(trainNumber, destinationStationCode);
  const railkit = await loadRailkit();
  return throwIfUnsuccessful(await railkit.trackTrain(trainNumber, journeyDate));
}

// RailKit returns the journey date as a human-readable string (e.g.
// "Jul 14, 2026 3:00:00 PM"); trackTrain expects DD-MM-YYYY, so convert once here.
function toTrackTrainDate(dateOfJourney) {
  if (!dateOfJourney) return null;
  const parsed = new Date(dateOfJourney);
  if (Number.isNaN(parsed.getTime())) return null;
  const dd = String(parsed.getDate()).padStart(2, "0");
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${parsed.getFullYear()}`;
}

// Normalizes RailKit's PNR response into the shape the rest of the app uses.
function normalizePnrResponse(raw) {
  const data = raw?.data || {};
  const passenger = data.passengers?.[0]?.current || {};
  const coach = passenger.coach;
  const berth = passenger.berthNo;
  // "Chart Not Prepared" contains the substring "prepared" too, so a naive
  // /prepared/i test would misread it as prepared — check for "not" explicitly.
  const chartStatus = (data.chart?.status || "").toLowerCase();
  const chartPrepared = chartStatus.includes("prepared") && !chartStatus.includes("not prepared");

  return {
    trainNumber: data.train?.number || null,
    trainName: data.train?.name || null,
    boardingStation: data.journey?.source?.name || null,
    destinationStation: data.journey?.destination?.name || null,
    destinationStationCode: data.journey?.destination?.code || null,
    journeyDate: toTrackTrainDate(data.journey?.dateOfJourney),
    travelClass: data.journey?.class || null,
    coachSeat: coach && berth != null ? `${coach} / ${berth}` : null,
    chartPrepared,
  };
}

// RailKit's per-stop times are strings like "22:05 16-Jul" (sometimes with a
// trailing "*" marking a live-predicted time) with no year — reconstructed
// from the response's own `date` field (e.g. "16-Jul-2026").
function parseStationTime(timeStr, yearReference) {
  if (!timeStr) return null;
  const cleaned = timeStr.replace("*", "").trim();
  const match = /^(\d{2}):(\d{2})\s+(\d{1,2})-(\w{3})$/.exec(cleaned);
  if (!match) return null;

  const [, hh, mm, day, monAbbr] = match;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthIndex = months.indexOf(monAbbr);
  if (monthIndex === -1) return null;

  const year = yearReference ? new Date(yearReference).getFullYear() : new Date().getFullYear();
  return new Date(year, monthIndex, Number(day), Number(hh), Number(mm)).toISOString();
}

// Delay is a free-text string ("On Time", "18 min late", "") rather than a number.
function parseDelayMinutes(delayStr) {
  if (!delayStr) return null;
  if (/on time/i.test(delayStr)) return 0;
  const match = /(\d+)/.exec(delayStr);
  return match ? Number(match[1]) : null;
}

// Normalizes RailKit's live-tracking response into { delayMinutes, expectedArrivalAtDestination, lastUpdated }.
// Matches the destination by station code first (exact, reliable), falling
// back to a case-insensitive name match if no code was available.
function normalizeTrainStatusResponse(raw, destinationStationCode, destinationStationName) {
  const data = raw?.data || {};
  const timeline = Array.isArray(data.timeline) ? data.timeline : [];
  const code = destinationStationCode?.toUpperCase();
  const name = destinationStationName?.toLowerCase();

  const stop = timeline.find((entry) => {
    if (code && entry.stationCode?.toUpperCase() === code) return true;
    if (name && entry.stationName?.toLowerCase() === name) return true;
    return false;
  });

  if (!stop) {
    return { delayMinutes: null, expectedArrivalAtDestination: null, lastUpdated: data.lastUpdate || null };
  }

  const timeStr = stop.arrival?.actual || stop.arrival?.scheduled;

  return {
    delayMinutes: parseDelayMinutes(stop.arrival?.delay),
    expectedArrivalAtDestination: parseStationTime(timeStr, data.date),
    lastUpdated: data.lastUpdate || null,
  };
}

module.exports = {
  checkPNRStatus,
  trackTrain,
  normalizePnrResponse,
  normalizeTrainStatusResponse,
  isMock,
};
