import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLegacyPage } from "../legacy/useLegacyPage";

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
      <div class="stat-title">Today's Earnings</div>
      <div class="stat-value" id="todayEarningsValue">₹850</div>
      <div class="stat-trend positive">+12% from yesterday</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">Jobs Completed</div>
      <div class="stat-value" id="jobsCompletedValue">5</div>
      <div class="stat-trend">Target: 8</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">Rating</div>
      <div class="stat-value">4.9 ⭐</div>
      <div class="stat-trend">Excellent</div>
    </div>
  </div>

  <div class="status-area">
    <div class="radar-animation">
      <div class="radar-circle"></div>
      <div class="radar-circle"></div>
      <div class="radar-circle"></div>
      <div class="radar-icon">📡</div>
    </div>
    <h2>Searching for nearby passengers...</h2>
    <p style="color: var(--muted)">Stay on this page to receive job notifications.</p>
  </div>

  <div id="jobModal" class="modal-overlay hidden">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">New Job Assignment! 🔔</div>
        <span class="time-badge">Just now</span>
      </div>

      <div class="job-details">
        <div class="detail-row"><span class="detail-label">Platform</span><span class="detail-value">Platform 4</span></div>
        <div class="detail-row"><span class="detail-label">Train</span><span class="detail-value">12951 - Rajdhani Exp</span></div>
        <div class="detail-row"><span class="detail-label">Coach/Seat</span><span class="detail-value">B2 / 45</span></div>
        <div class="detail-row"><span class="detail-label">Arrival Time</span><span class="detail-value">14:30 (in 15 mins)</span></div>
        <div class="detail-row"><span class="detail-label">Est. Earning</span><span class="detail-value highlight">₹150</span></div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-outline" onclick="declineJob()">Decline</button>
        <button class="btn btn-primary" onclick="acceptJob()">Accept Job</button>
      </div>
    </div>
  </div>
</main>
`;

export function PorterDashboardPage() {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const setup = useCallback(
    ({ container }) => {
      const DASHBOARD_STATS_KEY = "porterDashboardStats";
      const DEFAULT_DASHBOARD_STATS = { todaysEarnings: 850, jobsCompleted: 5 };
      const CURRENT_JOB = {
        platform: "Platform 4",
        train: "12951 - Rajdhani Exp",
        earning: 150,
      };

      let activeAcceptedJob = null;
      const timeouts = [];

      const previousFns = {
        acceptJob: window.acceptJob,
        declineJob: window.declineJob,
        completeJob: window.completeJob,
        logout: window.logout,
      };

      const queueTimeout = (fn, delay) => {
        const id = window.setTimeout(fn, delay);
        timeouts.push(id);
      };

      const getDashboardStats = () => {
        const savedStats = localStorage.getItem(DASHBOARD_STATS_KEY);

        if (!savedStats) {
          localStorage.setItem(
            DASHBOARD_STATS_KEY,
            JSON.stringify(DEFAULT_DASHBOARD_STATS),
          );
          return { ...DEFAULT_DASHBOARD_STATS };
        }

        try {
          const parsedStats = JSON.parse(savedStats);
          return {
            todaysEarnings:
              typeof parsedStats.todaysEarnings === "number"
                ? parsedStats.todaysEarnings
                : DEFAULT_DASHBOARD_STATS.todaysEarnings,
            jobsCompleted:
              typeof parsedStats.jobsCompleted === "number"
                ? parsedStats.jobsCompleted
                : DEFAULT_DASHBOARD_STATS.jobsCompleted,
          };
        } catch (error) {
          localStorage.setItem(
            DASHBOARD_STATS_KEY,
            JSON.stringify(DEFAULT_DASHBOARD_STATS),
          );
          return { ...DEFAULT_DASHBOARD_STATS };
        }
      };

      const saveDashboardStats = (stats) => {
        localStorage.setItem(DASHBOARD_STATS_KEY, JSON.stringify(stats));
      };

      const renderDashboardStats = () => {
        const stats = getDashboardStats();
        const earningsValue = container.querySelector("#todayEarningsValue");
        const jobsCompletedValue = container.querySelector(
          "#jobsCompletedValue",
        );

        if (earningsValue) {
          earningsValue.textContent = `₹${stats.todaysEarnings}`;
        }

        if (jobsCompletedValue) {
          jobsCompletedValue.textContent = stats.jobsCompleted;
        }
      };

      const showJobNotification = () => {
        const modal = container.querySelector("#jobModal");
        if (!modal) {
          return;
        }

        modal.classList.remove("hidden");
        void modal.offsetWidth;
        modal.classList.add("show");

        try {
          const audio = new Audio(
            "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
          );
          audio.play().catch(() => {});
        } catch (error) {
          console.log("Audio error");
        }
      };

      window.acceptJob = () => {
        activeAcceptedJob = { ...CURRENT_JOB };
        alert(`Job Accepted! Proceed to ${activeAcceptedJob.platform}.`);

        const modal = container.querySelector("#jobModal");
        modal?.classList.remove("show");
        queueTimeout(() => {
          modal?.classList.add("hidden");
        }, 300);

        const statusArea = container.querySelector(".status-area");
        if (!statusArea) {
          return;
        }

        statusArea.innerHTML = `
          <div style="text-align: center">
            <div style="font-size: 48px; margin-bottom: 16px">🏃</div>
            <h2>Job in Progress</h2>
            <p style="color: var(--muted)">Head to ${activeAcceptedJob.platform} for ${activeAcceptedJob.train}</p>
            <button id="completeBtn" class="btn btn-primary" style="margin-top: 16px" onclick="completeJob()">Mark as Completed</button>
          </div>
        `;
      };

      window.declineJob = () => {
        const modal = container.querySelector("#jobModal");
        modal?.classList.remove("show");
        queueTimeout(() => {
          modal?.classList.add("hidden");
        }, 300);

        queueTimeout(showJobNotification, 3000);
      };

      window.completeJob = () => {
        if (!activeAcceptedJob) {
          alert("Please accept a job first.");
          return;
        }

        const stats = getDashboardStats();
        stats.jobsCompleted += 1;
        stats.todaysEarnings += activeAcceptedJob.earning;
        saveDashboardStats(stats);
        renderDashboardStats();

        alert(`Great job! ₹${activeAcceptedJob.earning} added to your wallet.`);

        activeAcceptedJob = null;

        const statusArea = container.querySelector(".status-area");
        if (statusArea) {
          statusArea.innerHTML = `
            <div class="radar-animation">
              <div class="radar-circle"></div>
              <div class="radar-circle"></div>
              <div class="radar-circle"></div>
              <div class="radar-icon">📡</div>
            </div>
            <h2>Searching for nearby passengers...</h2>
            <p style="color: var(--muted)">
              Stay on this page to receive job notifications.
            </p>
          `;
        }

        queueTimeout(showJobNotification, 3000);
      };

      window.logout = () => {
        if (confirm("Are you sure you want to logout?")) {
          localStorage.removeItem("username");
          navigate("/home");
        }
      };

      const username = localStorage.getItem("username");
      if (username) {
        const porterName = container.querySelector("#porterName");
        if (porterName) {
          porterName.textContent = username;
        }
      }

      renderDashboardStats();
      queueTimeout(showJobNotification, 3000);

      return () => {
        timeouts.forEach((id) => clearTimeout(id));
        window.acceptJob = previousFns.acceptJob;
        window.declineJob = previousFns.declineJob;
        window.completeJob = previousFns.completeJob;
        window.logout = previousFns.logout;
      };
    },
    [navigate],
  );

  useLegacyPage({ containerRef, html: DASHBOARD_HTML, navigate, setup });

  return <div ref={containerRef} />;
}
