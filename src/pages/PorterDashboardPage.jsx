import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLegacyPage } from "../legacy/useLegacyPage";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5001/api";

const DASHBOARD_HTML = `
<aside class="sidebar">
  <div class="sidebar-logo">
    <div class="logo-badge"><span style="font-size: 20px">🚂</span></div>
    <div>
      <div class="brand-title racing-font">eKoolie</div>
      <div style="font-size: 12px; color: #9aa3a6; margin-top: 4px">Porter Partner</div>
    </div>
  </div>

  <nav class="sidebar-nav">
    <a href="#" class="nav-link active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3"></path></svg>
      Dashboard
    </a>
    <a href="#" class="nav-link">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6m0 0v6m0-6h6m-6 0H6"></path></svg>
      My Jobs
    </a>
    <a href="#" class="nav-link">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      Earnings
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

<main class="main">
  <div class="dashboard-header">
    <h1 class="welcome-text">Welcome back, <span id="porterName">Partner</span>!</h1>
    <div class="status-badge online">Online</div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-title">Total Earnings</div>
      <div class="stat-value" id="totalEarningsValue">₹0</div>
      <div class="stat-trend">Updated from live bookings</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">Jobs Completed</div>
      <div class="stat-value" id="jobsCompletedValue">0</div>
      <div class="stat-trend">Live count from database</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">Rating</div>
      <div class="stat-value" id="ratingValue">--</div>
      <div class="stat-trend">Customer feedback</div>
    </div>
  </div>

  <div class="skills-panel">
    <div class="skills-title">Skills</div>
    <div id="skillsList" class="skills-list"></div>
  </div>

  <div class="status-area">
    <h2>Incoming Booking Requests</h2>
    <p id="requestsHint" style="color: var(--muted)">
      Requests assigned to you will appear here.
    </p>
    <div style="display: flex; align-items: center; gap: 12px; margin: 10px 0 14px;">
      <div id="requestsCount" class="skill-chip">0 requests</div>
      <button id="refreshRequestsBtn" class="btn btn-outline" type="button">Refresh</button>
    </div>
    <div id="requestsList" class="requests-list"></div>
    <div id="activeJob" class="active-job hidden"></div>
  </div>
</main>
`;

export function PorterDashboardPage() {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const setup = useCallback(
    ({ container }) => {
      const previousFns = {
        acceptBooking: window.acceptBooking,
        declineBooking: window.declineBooking,
        completeBooking: window.completeBooking,
        logout: window.logout,
      };
      const porterId = localStorage.getItem("porterId");
      const porterNameFallback = localStorage.getItem("porterName");
      const requestsList = container.querySelector("#requestsList");
      const requestsHint = container.querySelector("#requestsHint");
      const requestsCount = container.querySelector("#requestsCount");
      const refreshRequestsBtn = container.querySelector("#refreshRequestsBtn");
      const activeJob = container.querySelector("#activeJob");
      let lastRequestIds = [];

      const escapeHtml = (value) =>
        String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");

      const renderSkills = (skills = []) => {
        const skillsList = container.querySelector("#skillsList");
        if (!skillsList) {
          return;
        }

        if (!skills.length) {
          skillsList.innerHTML =
            '<span class="skill-chip">No skills listed</span>';
          return;
        }

        skillsList.innerHTML = skills
          .map(
            (skill) => `<span class="skill-chip">${escapeHtml(skill)}</span>`,
          )
          .join("");
      };

      const renderPorter = (porter) => {
        const porterName = container.querySelector("#porterName");
        const earningsValue = container.querySelector("#totalEarningsValue");
        const jobsCompletedValue = container.querySelector(
          "#jobsCompletedValue",
        );
        const ratingValue = container.querySelector("#ratingValue");

        if (porterName) {
          porterName.textContent =
            porter?.name || porterNameFallback || "Partner";
        }

        if (earningsValue) {
          earningsValue.textContent = `₹${porter?.earnings ?? 0}`;
        }

        if (jobsCompletedValue) {
          jobsCompletedValue.textContent = porter?.completedBookings ?? 0;
        }

        if (ratingValue) {
          ratingValue.textContent = porter?.rating
            ? `${porter.rating} ⭐`
            : "--";
        }

        renderSkills(porter?.skills || []);
      };

      const renderRequests = (requests = []) => {
        if (!requestsList) {
          return;
        }

        if (requestsCount) {
          requestsCount.textContent = `${requests.length} request${requests.length === 1 ? "" : "s"}`;
        }

        if (requestsHint) {
          requestsHint.textContent =
            requests.length > 0
              ? `You have ${requests.length} active booking request${requests.length === 1 ? "" : "s"}.`
              : "Requests assigned to you will appear here.";
        }

        if (!requests.length) {
          requestsList.innerHTML =
            '<div class="request-empty">No new requests right now.</div>';
          return;
        }

        requestsList.innerHTML = requests
          .map(
            (booking) => `
              <div class="request-card">
                <div class="request-header">
                  <div>
                    <div class="request-title">${escapeHtml(
                      booking.station || "Station",
                    )}</div>
                    <div class="request-sub">${escapeHtml(
                      booking.userId || "User",
                    )} • ${escapeHtml(booking.userPhone || "")}</div>
                  </div>
                  <div class="request-fare">₹${escapeHtml(
                    booking.estimatedFare ?? 0,
                  )}</div>
                </div>
                <div class="request-meta">${escapeHtml(
                  booking.specialRequests || "No additional notes",
                )}</div>
                <div class="request-actions">
                  <button class="btn btn-outline" onclick="declineBooking('${booking._id}')">Decline</button>
                  <button class="btn btn-primary" onclick="acceptBooking('${booking._id}')">Accept</button>
                </div>
              </div>
            `,
          )
          .join("");
      };

      const renderActiveJob = (booking) => {
        if (!activeJob) {
          return;
        }

        if (!booking) {
          activeJob.classList.add("hidden");
          activeJob.innerHTML = "";
          return;
        }

        activeJob.classList.remove("hidden");
        activeJob.innerHTML = `
          <div class="active-card">
            <div class="active-title">Current Booking</div>
            <div class="active-meta">${escapeHtml(
              booking.station || "Station",
            )}</div>
            <div class="active-meta">${escapeHtml(
              booking.specialRequests || "No details provided",
            )}</div>
            <div class="active-meta">Payment: ${escapeHtml(
              booking.paymentStatus || "unpaid",
            )}</div>
            <div class="active-actions">
              <button class="btn btn-primary" onclick="completeBooking('${booking._id}')">Mark as Completed</button>
            </div>
          </div>
        `;
      };

      const fetchPorter = async () => {
        const response = await fetch(`${API_BASE_URL}/porters/${porterId}`);
        if (!response.ok) {
          throw new Error("Unable to load porter profile");
        }
        const payload = await response.json();
        return payload.data;
      };

      const fetchBookings = async (status) => {
        const response = await fetch(
          `${API_BASE_URL}/porters/${porterId}/bookings?status=${encodeURIComponent(status)}`,
        );
        if (!response.ok) {
          throw new Error("Unable to load bookings");
        }
        const payload = await response.json();
        return payload.data || [];
      };

      const refreshDashboard = async () => {
        if (!porterId) {
          return;
        }

        try {
          const [porter, requests, activeBookings] = await Promise.all([
            fetchPorter(),
            fetchBookings("requested"),
            fetchBookings("assigned"),
          ]);

          const currentRequestIds = requests.map((booking) => booking._id);
          const hasNewRequest =
            currentRequestIds.length > lastRequestIds.length ||
            currentRequestIds.some((id, index) => id !== lastRequestIds[index]);

          renderPorter(porter);
          renderRequests(requests);
          renderActiveJob(activeBookings[0]);

          if (hasNewRequest && requests.length > 0) {
            requestsList?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }

          lastRequestIds = currentRequestIds;
        } catch (error) {
          if (requestsHint) {
            requestsHint.textContent =
              error.message || "Unable to load dashboard data.";
          }
        }
      };

      window.acceptBooking = async (bookingId) => {
        if (!porterId) {
          return;
        }

        try {
          const response = await fetch(
            `${API_BASE_URL}/porters/${porterId}/bookings/${bookingId}/accept`,
            { method: "POST" },
          );

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || "Unable to accept booking.");
          }

          await refreshDashboard();
        } catch (error) {
          alert(error.message || "Unable to accept booking.");
        }
      };

      window.declineBooking = async (bookingId) => {
        if (!porterId) {
          return;
        }

        try {
          const response = await fetch(
            `${API_BASE_URL}/porters/${porterId}/bookings/${bookingId}/decline`,
            { method: "POST" },
          );

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || "Unable to decline booking.");
          }

          await refreshDashboard();
        } catch (error) {
          alert(error.message || "Unable to decline booking.");
        }
      };

      window.completeBooking = async (bookingId) => {
        if (!porterId) {
          return;
        }

        try {
          const response = await fetch(
            `${API_BASE_URL}/porters/${porterId}/bookings/${bookingId}/complete`,
            { method: "POST" },
          );

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || "Unable to complete booking.");
          }

          await refreshDashboard();
        } catch (error) {
          alert(error.message || "Unable to complete booking.");
        }
      };

      if (refreshRequestsBtn) {
        refreshRequestsBtn.onclick = () => {
          void refreshDashboard();
        };
      }

      window.logout = () => {
        if (confirm("Are you sure you want to logout?")) {
          localStorage.removeItem("porterId");
          localStorage.removeItem("porterName");
          localStorage.removeItem("porterUsername");
          navigate("/login");
        }
      };

      if (!porterId) {
        alert("Please login as a porter first.");
        navigate("/login");
        return () => {};
      }

      const pollId = window.setInterval(refreshDashboard, 3000);
      refreshDashboard();

      return () => {
        window.clearInterval(pollId);
        window.acceptBooking = previousFns.acceptBooking;
        window.declineBooking = previousFns.declineBooking;
        window.completeBooking = previousFns.completeBooking;
        window.logout = previousFns.logout;
      };
    },
    [navigate],
  );

  useLegacyPage({ containerRef, html: DASHBOARD_HTML, navigate, setup });

  return <div ref={containerRef} />;
}
