import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { getAccessToken } from "../api/client";
import { logout as logoutRequest } from "../api/auth";
import { getStations } from "../api/stations";
import { findNearestPorters, requestBooking, getBooking } from "../api/bookings";
import { lookupPnr, lookupTrainStatus, geocodeStation } from "../api/journey";
import "./BookPage.css";

const FALLBACK_STATIONS = [
  { name: "New Delhi Station", city: "New Delhi", coordinates: [77.209, 28.6139] },
  { name: "Mumbai Central", city: "Mumbai", coordinates: [72.8356, 18.9402] },
  { name: "Howrah Junction", city: "Kolkata", coordinates: [88.2636, 22.5958] },
  { name: "Bengaluru City", city: "Bengaluru", coordinates: [77.5946, 12.9716] },
  { name: "Chennai Central", city: "Chennai", coordinates: [80.2707, 13.0827] },
  { name: "Hyderabad Deccan", city: "Hyderabad", coordinates: [78.4867, 17.385] },
  { name: "Pune Junction", city: "Pune", coordinates: [73.8567, 18.5204] },
  { name: "Ahmedabad Junction", city: "Ahmedabad", coordinates: [72.5714, 23.0225] },
  { name: "Lucknow Charbagh", city: "Lucknow", coordinates: [80.9462, 26.8467] },
  { name: "Patiala Station", city: "Patiala", coordinates: [76.3869, 30.3398] },
];

function getDistanceKm(origin, target) {
  if (!origin || !target) return null;
  const [originLng, originLat] = origin;
  const [targetLng, targetLat] = target;
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(targetLat - originLat);
  const deltaLng = toRadians(targetLng - originLng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(originLat)) * Math.cos(toRadians(targetLat)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBrowserLocation() {
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve([position.coords.longitude, position.coords.latitude]),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 },
    );
  });
}

function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

const NAV_LINKS = [{ href: "/book", label: "Book Porter" }];

export function BookPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    train_number: "",
    coach: "",
    seat_number: "",
    station: "",
    phone: "",
    weight: "25",
    platform: "",
    time: "",
  });
  const [stationOptions, setStationOptions] = useState([]);
  const [pnr, setPnr] = useState("");
  const [isFetchingJourney, setIsFetchingJourney] = useState(false);
  const [journeyStatus, setJourneyStatus] = useState({ text: "", isError: false });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resultHeading, setResultHeading] = useState({
    title: "Nearest Porters",
    subtitle: "Checking live Atlas availability.",
  });
  const [searchStatus, setSearchStatus] = useState({ text: "", isError: false });
  const [porters, setPorters] = useState([]);
  const [showActiveBookingBanner, setShowActiveBookingBanner] = useState(false);

  const stationCoordsRef = useRef({});
  const bookingDraftRef = useRef(null);
  const resultRef = useRef(null);

  const username = localStorage.getItem("username");

  const getStationCoordinates = (name) => {
    if (!name) return null;
    const normalized = name.trim().toLowerCase();
    for (const [key, coords] of Object.entries(stationCoordsRef.current)) {
      if (key.toLowerCase() === normalized) return coords;
    }
    return null;
  };

  const saveCurrentBooking = (booking) => {
    if (!booking) return;
    localStorage.setItem("latestBookingRequest", JSON.stringify(booking));
    localStorage.setItem("selectedBooking", JSON.stringify(booking));
  };

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    (async () => {
      try {
        const payload = await getStations();
        const stations = Array.isArray(payload.data) && payload.data.length > 0 ? payload.data : FALLBACK_STATIONS;
        stations.forEach((s) => {
          const coords = s.location?.coordinates || s.coordinates;
          if (Array.isArray(coords) && coords.length === 2) {
            stationCoordsRef.current[s.name] = coords;
          }
        });
        setStationOptions(stations.map((s) => ({ name: s.name, city: s.city })));
      } catch (error) {
        console.warn("Failed to load stations for dropdown", error);
        FALLBACK_STATIONS.forEach((s) => {
          stationCoordsRef.current[s.name] = s.coordinates;
        });
        setStationOptions(FALLBACK_STATIONS.map((s) => ({ name: s.name, city: s.city })));
      }
    })();

    const persisted = readJSON("latestBookingRequest");
    if (persisted?._id) {
      // One-time freshness check, not a poll — this page no longer tracks an
      // active booking's live status, /tracking does. Falls back to the
      // cached status if the fetch itself fails.
      (async () => {
        try {
          const payload = await getBooking(persisted._id);
          const fresh = payload.data;
          if (fresh) {
            saveCurrentBooking(fresh);
            setShowActiveBookingBanner(!["completed", "cancelled"].includes(fresh.status));
          }
        } catch {
          setShowActiveBookingBanner(!["completed", "cancelled"].includes(persisted.status));
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  // Autofill convenience only: every field it touches stays editable, and
  // any failure (bad PNR, quota exhausted, network error) just leaves the
  // form exactly as usable as manual entry always was.
  const handleFetchJourney = async () => {
    const pnrValue = pnr.trim();
    if (!/^\d{10}$/.test(pnrValue)) {
      setJourneyStatus({ text: "Enter a valid 10-digit PNR.", isError: true });
      return;
    }

    setIsFetchingJourney(true);
    setJourneyStatus({ text: "Fetching journey details...", isError: false });

    try {
      const pnrPayload = await lookupPnr(pnrValue);
      const journey = pnrPayload.data;

      const matchedStation = stationOptions.find(
        (s) => s.name.trim().toLowerCase() === (journey.destinationStation || "").trim().toLowerCase(),
      );

      // Not one of our 10 seeded stations by name — try to place it on the
      // map anyway via geocoding. This resolves coordinates for the search,
      // it does not guarantee any porter actually exists near there.
      let geocodedStation = null;
      if (!matchedStation && journey.destinationStation) {
        try {
          const geoPayload = await geocodeStation(journey.destinationStation);
          const { lat, lon } = geoPayload.data;
          stationCoordsRef.current[journey.destinationStation] = [lon, lat];
          setStationOptions((current) =>
            current.some((s) => s.name.toLowerCase() === journey.destinationStation.toLowerCase())
              ? current
              : [...current, { name: journey.destinationStation, city: "via map lookup" }],
          );
          geocodedStation = { name: journey.destinationStation };
        } catch {
          // fall through — status message below covers this case
        }
      }

      setForm((f) => {
        const next = { ...f, train_number: journey.trainNumber || f.train_number };
        if (journey.coachSeat) {
          const [coachPart, seatPart] = journey.coachSeat.split("/").map((part) => part.trim());
          next.coach = coachPart || f.coach;
          next.seat_number = seatPart || f.seat_number;
        }
        if (matchedStation) {
          next.station = matchedStation.name;
        } else if (geocodedStation) {
          next.station = geocodedStation.name;
        }
        return next;
      });

      let statusMessage = `${journey.trainName || "Train"} — journey details loaded.`;
      if (!journey.chartPrepared && !journey.coachSeat) {
        statusMessage +=
          " Seat chart isn't prepared yet, so coach/seat aren't assigned — fill those in manually once available.";
      } else if (!journey.chartPrepared) {
        statusMessage += " Seat chart isn't finalized yet, so coach/seat may still change closer to departure.";
      }
      if (!matchedStation && geocodedStation) {
        statusMessage += ` Located "${journey.destinationStation}" on the map — we may not have a porter registered there yet, so the search below could come back empty.`;
      } else if (!matchedStation) {
        statusMessage += ` Couldn't locate "${journey.destinationStation}" on the map either — please pick a station manually.`;
      }

      if (journey.trainNumber && journey.journeyDate) {
        try {
          const statusPayload = await lookupTrainStatus(
            journey.trainNumber,
            journey.journeyDate,
            journey.destinationStation,
            journey.destinationStationCode,
          );
          const eta = statusPayload.data.expectedArrivalAtDestination;
          if (eta) {
            const etaDate = new Date(eta);
            const hh = String(etaDate.getHours()).padStart(2, "0");
            const mm = String(etaDate.getMinutes()).padStart(2, "0");
            setForm((f) => ({ ...f, time: `${hh}:${mm}` }));
            const delay = statusPayload.data.delayMinutes;
            statusMessage += ` Expected arrival ~${hh}:${mm}${
              typeof delay === "number" ? ` (running ${delay > 0 ? `${delay} min late` : "on time"})` : ""
            }.`;
          }
        } catch {
          statusMessage += " Couldn't fetch live running status, so the arrival time is left for you to set.";
        }
      }

      setJourneyStatus({ text: statusMessage, isError: false });
    } catch (error) {
      setJourneyStatus({
        text: error.message || "Couldn't fetch journey details. You can still fill in the form manually.",
        isError: true,
      });
    } finally {
      setIsFetchingJourney(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();

    const stationValue = form.station.trim();
    const phoneValue = form.phone.trim();
    const luggageWeight = Number(form.weight || 0);

    if (!phoneValue) {
      setSearchStatus({ text: "Please enter a contact phone number.", isError: true });
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    setSearchStatus({ text: "Looking up live Atlas porters...", isError: false });
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

    try {
      const demoCoordinates = getStationCoordinates(stationValue);
      const originCoordinates = demoCoordinates || (await getBrowserLocation());

      if (!originCoordinates) {
        setSearchStatus({
          text: "Could not derive a location. Enter one of the demo stations or allow browser location access.",
          isError: true,
        });
        setResultHeading({ title: `Nearest Porters${stationValue ? ` for ${stationValue}` : ""}`, subtitle: "No porters matched the current search. Try a different station or use your location." });
        setPorters([]);
        return;
      }

      bookingDraftRef.current = {
        userPhone: phoneValue,
        station: stationValue,
        location: { type: "Point", coordinates: originCoordinates },
        items: [
          {
            name: `Luggage from coach ${form.coach.trim() || "N/A"} seat ${form.seat_number.trim() || "N/A"}`,
            weight: Number.isFinite(luggageWeight) && luggageWeight > 0 ? luggageWeight : 25,
            description: `Train ${form.train_number.trim() || "N/A"}, Platform ${form.platform.trim() || "N/A"}, Arrival ${form.time || "N/A"}`,
          },
        ],
        specialRequests: `Train ${form.train_number.trim() || "N/A"} | Coach ${form.coach.trim() || "N/A"} | Seat ${form.seat_number.trim() || "N/A"} | Platform ${form.platform.trim() || "N/A"} | Arrival ${form.time || "N/A"}`,
      };

      const payload = await findNearestPorters({
        longitude: originCoordinates[0],
        latitude: originCoordinates[1],
        maxDistance: 5000,
        limit: 5,
        station: demoCoordinates && stationValue ? stationValue : undefined,
      });

      const availablePorters = Array.isArray(payload.data) ? payload.data : [];
      setPorters(availablePorters.map((porter) => ({ ...porter, __origin: originCoordinates })));
      setResultHeading({
        title: `Nearest Porters${stationValue ? ` for ${stationValue}` : ""}`,
        subtitle:
          availablePorters.length > 0
            ? "Choose a porter from the live Atlas results below."
            : "No porters matched the current search. Try a different station or use your location.",
      });
      setSearchStatus({
        text:
          availablePorters.length > 0
            ? `${availablePorters.length} nearby porter${availablePorters.length === 1 ? "" : "s"} found and available.`
            : "No available porters found nearby. Try a different station or enable location access.",
        isError: false,
      });
    } catch (error) {
      console.error("Nearest porter search failed:", error);
      setPorters([]);
      setSearchStatus({
        text: error.message || "Search failed. Check that the backend is running on port 5001 and Atlas is connected.",
        isError: true,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const requestPorter = async (porter) => {
    if (!bookingDraftRef.current) {
      setSearchStatus({ text: "Please search for porters first.", isError: true });
      return;
    }

    try {
      setSearchStatus({ text: `Sending a booking request to ${porter.name}...`, isError: false });

      const payload = await requestBooking({
        ...bookingDraftRef.current,
        assignedPorter: porter._id || porter.id,
      });

      saveCurrentBooking(payload.data);
      navigate("/tracking");
    } catch (error) {
      setSearchStatus({ text: error.message || "Unable to send booking request.", isError: true });
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logoutRequest().catch(() => {});
      localStorage.removeItem("username");
      localStorage.removeItem("latestBookingRequest");
      localStorage.removeItem("selectedBooking");
      navigate("/home");
    }
  };

  return (
    <div className="page book-page">
      <Navbar
        variant="translucent"
        links={NAV_LINKS}
        activeHref="/book"
        actions={
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            Logout
          </button>
        }
      />

      <main className="page-main container book-main">
        {username && <div className="user-greeting">Hello {username}</div>}

        {showActiveBookingBanner && (
          <div className="active-booking-banner">
            <span>You have an active booking request.</span>
            <Link to="/tracking" className="btn btn-outline btn-sm">
              View Tracking
            </Link>
          </div>
        )}

        <div className="card book-form-card">
          <h1 style={{ marginBottom: 24, fontSize: 28 }}>Book a Porter</h1>

          <div className="field pnr-lookup">
            <label className="field-label">Have a PNR? Fetch your journey details</label>
            <div className="pnr-lookup-row">
              <input
                className="input"
                placeholder="10-digit PNR"
                maxLength={10}
                value={pnr}
                onChange={(event) => setPnr(event.target.value.replace(/\D/g, ""))}
              />
              <button
                type="button"
                className="btn btn-outline"
                disabled={isFetchingJourney}
                onClick={handleFetchJourney}
              >
                {isFetchingJourney ? "Fetching..." : "Fetch Journey Details"}
              </button>
            </div>
            {journeyStatus.text && (
              <div
                className="field-hint"
                style={{ color: journeyStatus.isError ? "#fca5a5" : "var(--text-muted)" }}
              >
                {journeyStatus.text}
              </div>
            )}
            <div className="field-hint">
              Optional — this only pre-fills the fields below, all of which you can still edit.
            </div>
          </div>

          <form onSubmit={handleSearch} noValidate>
            <div className="field">
              <label className="field-label">Train Number</label>
              <input className="input" placeholder="e.g. 12951" required value={form.train_number} onChange={updateField("train_number")} />
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="field-label">Coach</label>
                <input className="input" placeholder="e.g. B2" required value={form.coach} onChange={updateField("coach")} />
              </div>
              <div className="field">
                <label className="field-label">Seat Number</label>
                <input className="input" placeholder="e.g. 45" required value={form.seat_number} onChange={updateField("seat_number")} />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Arrival Station</label>
              <select className="select" required value={form.station} onChange={updateField("station")}>
                <option value="">Select a station</option>
                {stationOptions.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} — {s.city}
                  </option>
                ))}
              </select>
              <div className="field-hint">Choose a seeded station from the dropdown. This prevents outside station names.</div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="field-label">Contact Phone</label>
                <input type="tel" className="input" placeholder="e.g. 9876543210" required value={form.phone} onChange={updateField("phone")} />
              </div>
              <div className="field">
                <label className="field-label">Approx. Luggage Weight (kg)</label>
                <input type="number" min="0" step="1" className="input" required value={form.weight} onChange={updateField("weight")} />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="field-label">Platform Number</label>
                <input className="input" placeholder="e.g. 12" required value={form.platform} onChange={updateField("platform")} />
              </div>
              <div className="field">
                <label className="field-label">Arrival Time</label>
                <input type="time" className="input" required value={form.time} onChange={updateField("time")} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search Nearby Porters"}
            </button>
          </form>
        </div>

        {showResults && (
          <div className="card result-card" ref={resultRef} style={{ marginTop: 24 }}>
            <h3 style={{ color: "var(--blue-light)", marginBottom: 8 }}>{resultHeading.title}</h3>
            <p style={{ color: "var(--text-muted)" }}>{resultHeading.subtitle}</p>
            {searchStatus.text && (
              <div className="search-status" style={{ color: searchStatus.isError ? "#fca5a5" : "var(--text-muted)" }}>
                {searchStatus.text}
              </div>
            )}

            <div className="porter-list">
              {porters.length === 0 && (
                <div className="porter-empty">
                  No live match found in Atlas for this search. If you typed a non-demo station, try one of the
                  seeded stations or allow location access.
                </div>
              )}
              {porters.map((porter, index) => {
                const distanceKm = getDistanceKm(porter.__origin, porter.location?.coordinates);
                const distanceText = typeof distanceKm === "number" ? `${distanceKm.toFixed(1)} km away` : "Distance unavailable";
                return (
                  <div className="porter-card" key={porter._id || index}>
                    <div className="porter-preview">
                      <div className="porter-avatar" />
                      <div>
                        <div className="porter-name">{porter.name}</div>
                        <div className="porter-meta">
                          {porter.station} • ⭐ {porter.rating} • {distanceText}
                        </div>
                      </div>
                    </div>
                    <div className="porter-details">
                      Capacity: {porter.maxLoad} kg
                      <br />
                      Skills: {Array.isArray(porter.skills) && porter.skills.length > 0 ? porter.skills.join(", ") : "No skills listed"}
                    </div>
                    <div className="grid-2">
                      <Link to="/porter-profile" className="btn btn-outline btn-sm" style={{ textAlign: "center" }}>
                        View Details
                      </Link>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => requestPorter(porter)}>
                        Send Request
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
