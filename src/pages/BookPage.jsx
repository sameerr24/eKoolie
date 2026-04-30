import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLegacyPage } from "../legacy/useLegacyPage";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5001/api";

const STATION_COORDINATES = {};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getStationCoordinates(stationName) {
  if (!stationName) {
    return null;
  }

  const normalized = stationName.trim().toLowerCase();

  for (const [name, coordinates] of Object.entries(STATION_COORDINATES)) {
    if (normalized === name.toLowerCase()) {
      return coordinates;
    }
  }

  return null;
}

function getDistanceKm(origin, target) {
  if (!origin || !target) {
    return null;
  }

  const [originLng, originLat] = origin;
  const [targetLng, targetLat] = target;
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const deltaLat = toRadians(targetLat - originLat);
  const deltaLng = toRadians(targetLng - originLng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(originLat)) *
      Math.cos(toRadians(targetLat)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBrowserLocation() {
  if (!navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.longitude, position.coords.latitude]);
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 },
    );
  });
}

function buildPorterCard(porter, index, originCoordinates) {
  const distanceKm = getDistanceKm(
    originCoordinates,
    porter.location?.coordinates,
  );
  const distanceText =
    typeof distanceKm === "number"
      ? `${distanceKm.toFixed(1)} km away`
      : "Distance unavailable";
  const skills = Array.isArray(porter.skills) ? porter.skills.join(", ") : "";

  return `
    <div class="result-card" style="padding: 16px; border: 1px solid rgba(255,255,255,0.08);">
      <div class="porter-preview" style="margin-bottom: 12px;">
        <div class="porter-avatar"></div>
        <div style="min-width: 0;">
          <div style="font-weight: 700; font-size: 18px">${escapeHtml(porter.name)}</div>
          <div style="color: var(--muted); font-size: 14px; line-height: 1.4">
            ${escapeHtml(porter.station)} • ⭐ ${escapeHtml(porter.rating)} • ${escapeHtml(distanceText)}
          </div>
        </div>
      </div>

      <div style="color: var(--muted); font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
        Capacity: ${escapeHtml(porter.maxLoad)} kg<br />
        Skills: ${escapeHtml(skills || "No skills listed")}
      </div>

      <div class="grid-2">
        <a href="porter_profile.html" class="btn btn-outline" style="text-align: center">View Details</a>
        <a href="#" class="btn btn-primary" style="text-align: center" onclick="requestPorter(${index}); return false;">Send Request</a>
      </div>
    </div>
  `;
}

function buildAssignedPorterCard(assignment, booking, stationLabel) {
  const porterName = assignment?.porterName || "Assigned porter";
  const porterRating =
    assignment?.porterRating ?? booking?.assignedPorter?.rating;
  const porterPhone =
    assignment?.porterPhone || booking?.assignedPorter?.phone || "N/A";
  const porterDistance = assignment?.distance || "N/A";

  return `
    <div class="result-card" style="padding: 16px; border: 1px solid rgba(255,255,255,0.08);">
      <h3 style="margin: 0 0 8px 0; color: var(--cyan)">Booking Confirmed</h3>
      <p style="margin: 0; color: var(--muted)">
        ${escapeHtml(stationLabel || booking?.station || "your station")} is covered by a live Atlas assignment.
      </p>

      <div class="porter-preview" style="margin: 16px 0 12px;">
        <div class="porter-avatar"></div>
        <div>
          <div style="font-weight: 700; font-size: 18px">${escapeHtml(porterName)}</div>
          <div style="color: var(--muted); font-size: 14px">⭐ ${escapeHtml(porterRating ?? "N/A")} • ${escapeHtml(porterDistance)}</div>
        </div>
      </div>

      <div style="color: var(--muted); font-size: 14px; line-height: 1.6; margin-bottom: 14px;">
        Booking ID: ${escapeHtml(booking?._id || "N/A")}<br />
        Status: ${escapeHtml(booking?.status || "assigned")}<br />
        Contact: ${escapeHtml(porterPhone)}
      </div>

      <div class="grid-2">
        <a href="porter_profile.html" class="btn btn-outline" style="text-align: center">View Details</a>
        <a href="payment.html" class="btn btn-primary" style="text-align: center">Proceed to Pay</a>
      </div>
    </div>
  `;
}

const BOOK_HTML = `
<aside class="sidebar">
  <div class="sidebar-logo">
    <div class="logo-badge">
      <span style="font-size: 20px">🚂</span>
    </div>
    <div>
      <div class="brand-title racing-font">eKoolie</div>
      <div style="font-size: 12px; color: #9aa3a6; margin-top: 4px">Koolie at your station</div>
    </div>
  </div>

  <nav class="sidebar-nav">
    <a href="home.html" class="nav-link">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3"></path></svg>
      Home
    </a>
    <a href="book.html" class="nav-link active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6m0 0v6m0-6h6m-6 0H6"></path></svg>
      Book Porter
    </a>
  </nav>

  <div class="sidebar-footer">
    <a href="#" onclick="logout()" class="nav-link" style="color: #ef4444">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      Logout
    </a>
  </div>
</aside>

<main class="main book-page">
  <div id="userGreeting" class="user-greeting"></div>
  <div class="card">
    <h1 style="margin-top: 0; margin-bottom: 24px">Book a Porter</h1>

    <form id="bookingForm" onsubmit="handleSearch(event)">
      <div class="form-group">
        <label class="form-label">Train Number</label>
        <input id="train_number" type="text" class="form-input" placeholder="e.g. 12951" required />
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Coach</label>
          <input id="coach" type="text" class="form-input" placeholder="e.g. B2" required />
        </div>
        <div class="form-group">
          <label class="form-label">Seat Number</label>
          <input id="seat_number" type="text" class="form-input" placeholder="e.g. 45" required />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Arrival Station</label>
        <select id="station" class="form-input" required>
          <option value="">Select a station</option>
        </select>
        <div style="margin-top: 8px; font-size: 12px; color: #9aa3a6; line-height: 1.5">
          Choose a seeded station from the dropdown. This prevents outside station names.
        </div>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Contact Phone</label>
          <input id="phone" type="tel" class="form-input" placeholder="e.g. 9876543210" required />
        </div>
        <div class="form-group">
          <label class="form-label">Approx. Luggage Weight (kg)</label>
          <input id="weight" type="number" min="0" step="1" class="form-input" placeholder="e.g. 25" value="25" required />
        </div>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Platform Number</label>
          <input id="platform" type="text" class="form-input" placeholder="e.g. 12" required />
        </div>
        <div class="form-group">
          <label class="form-label">Arrival Time</label>
          <input id="time" type="time" class="form-input" required />
        </div>
      </div>

      <button id="submit" type="submit" class="btn btn-primary" style="width: 100%">Search Nearby Porters</button>
    </form>

    <div id="resultSection" class="hidden">
      <div class="result-card">
        <h3 id="resultTitle" style="margin: 0 0 8px 0; color: var(--cyan)">Nearest Porters</h3>
        <p id="resultSubtitle" style="margin: 0; color: var(--muted)">Checking live Atlas availability.</p>
        <div id="searchStatus" style="margin-top: 12px; color: var(--muted); font-size: 14px;"></div>
        <div id="assignedBookingCard" style="margin-top: 16px;"></div>
        <div id="nearbyPortersList" style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px;"></div>
      </div>
    </div>
  </div>
</main>
`;

export function BookPage() {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const setup = useCallback(
    ({ container }) => {
      const previousFns = {
        handleSearch: window.handleSearch,
        logout: window.logout,
        selectPorter: window.selectPorter,
        requestPorter: window.requestPorter,
      };

      let bookingDraft = null;

      const getScrollContainer = () => {
        const candidates = [
          document.scrollingElement,
          document.documentElement,
          document.body,
          container.querySelector(".main"),
          container,
        ].filter(Boolean);

        return (
          candidates.find((el) => el.scrollHeight > el.clientHeight) ||
          document.scrollingElement ||
          document.documentElement
        );
      };

      const scrollToTarget = (target) => {
        if (!target) {
          return;
        }

        const scrollContainer = getScrollContainer();
        if (!scrollContainer) {
          return;
        }

        const containerRect = scrollContainer.getBoundingClientRect
          ? scrollContainer.getBoundingClientRect()
          : { top: 0 };
        const targetRect = target.getBoundingClientRect();
        const targetTop =
          targetRect.top - containerRect.top + scrollContainer.scrollTop;

        scrollContainer.scrollTo({
          top: Math.max(0, targetTop - 12),
          behavior: "smooth",
        });
      };

      const setButtonState = (button, text, isLoading) => {
        if (!button) {
          return;
        }

        button.innerText = text;
        button.disabled = isLoading;
        button.style.opacity = isLoading ? "0.7" : "1";
      };

      const showResultSection = () => {
        const resultSection = container.querySelector("#resultSection");
        resultSection?.classList.remove("hidden");
        // Align the top of the results with the top of the scroll container.
        scrollToTarget(resultSection);
      };

      const showSearchStatus = (message, isError = false) => {
        const searchStatus = container.querySelector("#searchStatus");
        if (!searchStatus) {
          return;
        }

        searchStatus.textContent = message;
        searchStatus.style.color = isError ? "#fca5a5" : "var(--muted)";
      };

      const renderPorters = (porters, originCoordinates, stationLabel) => {
        const resultTitle = container.querySelector("#resultTitle");
        const resultSubtitle = container.querySelector("#resultSubtitle");
        const listElement = container.querySelector("#nearbyPortersList");

        if (resultTitle) {
          resultTitle.textContent = `Nearest Porters${stationLabel ? ` for ${stationLabel}` : ""}`;
        }

        if (resultSubtitle) {
          resultSubtitle.textContent =
            porters.length > 0
              ? "Choose a porter from the live Atlas results below."
              : "No porters matched the current search. Try a different station or use your location.";
        }

        if (!listElement) {
          return;
        }

        listElement.innerHTML =
          porters.length > 0
            ? porters
                .map((porter, index) =>
                  buildPorterCard(porter, index, originCoordinates),
                )
                .join("")
            : `
              <div style="padding: 14px; border-radius: 14px; background: rgba(255,255,255,0.03); color: var(--muted); line-height: 1.5;">
                No live match found in Atlas for this search. If you typed a non-demo station, try one of the seeded stations or allow location access.
              </div>
            `;
      };

      const renderAssignedBooking = (assignment, booking, stationLabel) => {
        const resultTitle = container.querySelector("#resultTitle");
        const resultSubtitle = container.querySelector("#resultSubtitle");
        const assignedCardElement = container.querySelector(
          "#assignedBookingCard",
        );

        if (resultTitle) {
          resultTitle.textContent = "Booking Confirmed";
        }

        if (resultSubtitle) {
          resultSubtitle.textContent =
            "Your booking has been created and the best available porter has been assigned.";
        }

        if (assignedCardElement) {
          assignedCardElement.innerHTML = buildAssignedPorterCard(
            assignment,
            booking,
            stationLabel,
          );
        }
      };

      window.selectPorter = (porterIndex) => {
        const porterState = window.__selectedPorters?.[porterIndex];
        if (!porterState) {
          return;
        }

        localStorage.setItem("selectedPorter", JSON.stringify(porterState));
      };

      window.requestPorter = async (porterIndex) => {
        const porterState = window.__selectedPorters?.[porterIndex];
        if (!porterState) {
          return;
        }

        if (!bookingDraft) {
          showSearchStatus("Please search for porters first.", true);
          return;
        }

        try {
          showSearchStatus(
            `Sending a booking request to ${porterState.name}...`,
          );

          const response = await fetch(`${API_BASE_URL}/bookings/request`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...bookingDraft,
              assignedPorter: porterState._id || porterState.id,
            }),
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(
              payload.error || `Request failed with status ${response.status}`,
            );
          }

          const payload = await response.json();
          localStorage.setItem(
            "latestBookingRequest",
            JSON.stringify(payload.data),
          );

          showSearchStatus(
            `Request sent to ${porterState.name}. Wait for them to accept in their dashboard.`,
            false,
          );
        } catch (error) {
          showSearchStatus(
            error.message || "Unable to send booking request.",
            true,
          );
        }
      };

      window.__selectedPorters = [];

      const username = localStorage.getItem("username");
      if (username) {
        const greetingElement = container.querySelector("#userGreeting");
        if (greetingElement) {
          greetingElement.textContent = `Hello ${username}`;
        }
      }

      // Ensure the legacy page main area does not vertically center content
      // which can make the top unreachable when dynamic results expand.
      try {
        const pageMain = container.querySelector(".main");
        if (pageMain) {
          pageMain.style.justifyContent = "flex-start";
        }
      } catch (err) {
        // ignore
      }

      // Fetch stations from backend and populate the station dropdown
      (async function fetchAndPopulateStations() {
        try {
          const resp = await fetch(`${API_BASE_URL}/stations`);
          if (!resp.ok) return;
          const payload = await resp.json();
          const stations = Array.isArray(payload.data) ? payload.data : [];
          const stationSelect = container.querySelector("#station");
          if (!stationSelect) return;

          stations.forEach((s) => {
            const name = s.name;
            const coords = s.location?.coordinates;
            // populate global lookup used by getStationCoordinates
            if (Array.isArray(coords) && coords.length === 2) {
              STATION_COORDINATES[name] = coords;
            }
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = `${name} — ${s.city}`;
            stationSelect.appendChild(opt);
          });
        } catch (err) {
          console.warn("Failed to load stations for dropdown", err);
        }
      })();

      // Tag the document so Book page overrides can win over other CSS files.
      const htmlElement = document.documentElement;
      const bodyElement = document.body;
      htmlElement.classList.add("book-page-html");
      bodyElement.classList.add("book-page-body");

      window.handleSearch = async (event) => {
        event.preventDefault();
        const btn = event.target.querySelector('button[type="submit"]');
        if (!btn) {
          return false;
        }

        const originalText = btn.innerText;
        const stationInput = container.querySelector("#station");
        const phoneInput = container.querySelector("#phone");
        const weightInput = container.querySelector("#weight");
        const trainInput = container.querySelector("#train_number");
        const coachInput = container.querySelector("#coach");
        const seatInput = container.querySelector("#seat_number");
        const platformInput = container.querySelector("#platform");
        const timeInput = container.querySelector("#time");

        const stationValue = stationInput?.value?.trim() || "";
        const phoneValue = phoneInput?.value?.trim() || "";
        const luggageWeight = Number(weightInput?.value || 0);
        const demoCoordinates = getStationCoordinates(stationValue);
        const username = localStorage.getItem("username") || "guest-user";

        if (!phoneValue) {
          showSearchStatus("Please enter a contact phone number.", true);
          return false;
        }

        setButtonState(btn, "Searching...", true);
        showResultSection();
        showSearchStatus("Looking up live Atlas porters...");

        try {
          const originCoordinates =
            demoCoordinates || (await getBrowserLocation());

          if (!originCoordinates) {
            showSearchStatus(
              "Could not derive a location. Enter one of the demo stations or allow browser location access.",
              true,
            );
            renderPorters([], null, stationValue);
            return false;
          }

          bookingDraft = {
            userId: username,
            userPhone: phoneValue,
            station: stationValue,
            location: {
              type: "Point",
              coordinates: originCoordinates,
            },
            items: [
              {
                name: `Luggage from coach ${coachInput?.value?.trim() || "N/A"} seat ${seatInput?.value?.trim() || "N/A"}`,
                weight:
                  Number.isFinite(luggageWeight) && luggageWeight > 0
                    ? luggageWeight
                    : 25,
                description: `Train ${trainInput?.value?.trim() || "N/A"}, Platform ${platformInput?.value?.trim() || "N/A"}, Arrival ${timeInput?.value || "N/A"}`,
              },
            ],
            specialRequests: `Train ${trainInput?.value?.trim() || "N/A"} | Coach ${coachInput?.value?.trim() || "N/A"} | Seat ${seatInput?.value?.trim() || "N/A"} | Platform ${platformInput?.value?.trim() || "N/A"} | Arrival ${timeInput?.value || "N/A"}`,
          };

          const query = new URLSearchParams({
            longitude: String(originCoordinates[0]),
            latitude: String(originCoordinates[1]),
            maxDistance: "5000",
            limit: "5",
          });

          if (demoCoordinates && stationValue) {
            query.set("station", stationValue);
          }

          const response = await fetch(
            `${API_BASE_URL}/bookings/nearest-porters?${query.toString()}`,
          );
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const nearestPayload = await response.json();
          const porters = Array.isArray(nearestPayload.data)
            ? nearestPayload.data
            : [];

          const availablePorters = Array.isArray(porters) ? porters : [];

          window.__selectedPorters = availablePorters;
          renderPorters(
            availablePorters,
            originCoordinates,
            stationValue || "your location",
          );
          showSearchStatus(
            availablePorters.length > 0
              ? `${availablePorters.length} nearby porter${availablePorters.length === 1 ? "" : "s"} found and available.`
              : "No available porters found nearby. Try a different station or enable location access.",
            false,
          );
        } catch (error) {
          console.error("Nearest porter search failed:", error);
          renderPorters([], null, stationValue);
          showSearchStatus(
            error.message ||
              "Search failed. Check that the backend is running on port 5001 and Atlas is connected.",
            true,
          );
        } finally {
          setButtonState(btn, originalText, false);
        }

        return false;
      };

      window.logout = () => {
        if (confirm("Are you sure you want to logout?")) {
          localStorage.removeItem("username");
          navigate("/home");
        }
      };

      return () => {
        window.handleSearch = previousFns.handleSearch;
        window.logout = previousFns.logout;
        window.selectPorter = previousFns.selectPorter;
        window.requestPorter = previousFns.requestPorter;
        window.__selectedPorters = [];
        htmlElement.classList.remove("book-page-html");
        bodyElement.classList.remove("book-page-body");
      };
    },
    [navigate],
  );

  useLegacyPage({ containerRef, html: BOOK_HTML, navigate, setup });

  return <div ref={containerRef} />;
}
