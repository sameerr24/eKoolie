const DASHBOARD_STATS_KEY = "porterDashboardStats";
const DEFAULT_DASHBOARD_STATS = {
  todaysEarnings: 850,
  jobsCompleted: 5,
};

const CURRENT_JOB = {
  platform: "Platform 4",
  train: "12951 - Rajdhani Exp",
  earning: 150,
};

let activeAcceptedJob = null;

document.addEventListener("DOMContentLoaded", function () {
  // Set username
  const username = localStorage.getItem("username");
  if (username) {
    document.getElementById("porterName").textContent = username;
  }

  renderDashboardStats();
  setTimeout(showJobNotification, 3000);
});

function getDashboardStats() {
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
  } catch (e) {
    localStorage.setItem(
      DASHBOARD_STATS_KEY,
      JSON.stringify(DEFAULT_DASHBOARD_STATS),
    );
    return { ...DEFAULT_DASHBOARD_STATS };
  }
}

function saveDashboardStats(stats) {
  localStorage.setItem(DASHBOARD_STATS_KEY, JSON.stringify(stats));
}

function renderDashboardStats() {
  const stats = getDashboardStats();
  const earningsValue = document.getElementById("todayEarningsValue");
  const jobsCompletedValue = document.getElementById("jobsCompletedValue");

  if (earningsValue) {
    earningsValue.textContent = `₹${stats.todaysEarnings}`;
  }

  if (jobsCompletedValue) {
    jobsCompletedValue.textContent = stats.jobsCompleted;
  }
}

function showJobNotification() {
  const modal = document.getElementById("jobModal");
  modal.classList.remove("hidden");
  // Force reflow
  void modal.offsetWidth;
  modal.classList.add("show");

  // Play notification sound if possible (browsers might block this without interaction)
  try {
    const audio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    );
    audio
      .play()
      .catch((e) => console.log("Audio play failed due to browser policy"));
  } catch (e) {
    console.log("Audio error");
  }
}

function acceptJob() {
  activeAcceptedJob = { ...CURRENT_JOB };
  alert(`Job Accepted! Proceed to ${activeAcceptedJob.platform}.`);
  document.getElementById("jobModal").classList.remove("show");
  setTimeout(() => {
    document.getElementById("jobModal").classList.add("hidden");
  }, 300);

  // Update status area
  const statusArea = document.querySelector(".status-area");
  statusArea.innerHTML = `
    <div style="text-align: center">
      <div style="font-size: 48px; margin-bottom: 16px">🏃</div>
      <h2>Job in Progress</h2>
      <p style="color: var(--muted)">Head to ${activeAcceptedJob.platform} for ${activeAcceptedJob.train}</p>
      <button id="completeBtn" class="btn btn-primary" style="margin-top: 16px" onclick="completeJob()">Mark as Completed</button>
    </div>
  `;
}

function declineJob() {
  document.getElementById("jobModal").classList.remove("show");
  setTimeout(() => {
    document.getElementById("jobModal").classList.add("hidden");
  }, 300);

  // Reset timer for next job simulation
  setTimeout(showJobNotification, 3000);
}

function completeJob() {
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

  const statusArea = document.querySelector(".status-area");
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

  setTimeout(showJobNotification, 3000);
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("username");
    window.location.href = "home.html";
  }
}
