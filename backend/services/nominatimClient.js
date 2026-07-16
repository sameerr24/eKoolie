// OpenStreetMap Nominatim — free geocoding, no API key. Usage policy requires
// a descriptive User-Agent and no more than ~1 request/second; both are
// handled here. Callers should cache results permanently (StationGeocode) so
// each station is only ever geocoded once, regardless of app traffic.

const USER_AGENT = "eKoolie/1.0 (railway porter booking app; contact: karansameer02@gmail.com)";
const MIN_INTERVAL_MS = 1100;

let lastCallAt = 0;
let queue = Promise.resolve();

function throttle(fn) {
  queue = queue.then(async () => {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastCallAt));
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastCallAt = Date.now();
    return fn();
  });
  return queue;
}

// Returns { lat, lon, displayName } or null if nothing matched.
async function geocodeStation(stationName) {
  return throttle(async () => {
    const query = `${stationName} railway station, India`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) {
      throw new Error(`Nominatim request failed with status ${response.status}`);
    }

    const results = await response.json();
    const match = results?.[0];
    if (!match) return null;

    return {
      lat: parseFloat(match.lat),
      lon: parseFloat(match.lon),
      displayName: match.display_name || stationName,
    };
  });
}

module.exports = { geocodeStation };
