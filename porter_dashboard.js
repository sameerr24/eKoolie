document.addEventListener("DOMContentLoaded", function () {
  // Set username
  const username = localStorage.getItem("username");
  if (username) {
    document.getElementById("porterName").textContent = username;
  }
  setTimeout(showJobNotification, 3000);
});

function showJobNotification() {
  const modal = document.getElementById("jobModal");
  modal.classList.remove("hidden");
  // Force reflow
  void modal.offsetWidth;
  modal.classList.add("show");
  
  // Play notification sound if possible (browsers might block this without interaction)
  try {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Audio play failed due to browser policy"));
  } catch (e) {
    console.log("Audio error");
  }
}

function acceptJob() {
  alert("Job Accepted! Proceed to Platform 4.");
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
      <p style="color: var(--muted)">Head to Platform 4 for Train 12951</p>
      <button class="btn btn-primary" style="margin-top: 16px" onclick="completeJob()">Mark as Completed</button>
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
  alert("Great job! ₹150 added to your wallet.");
  location.reload();
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("username");
    window.location.href = "home.html";
  }
}
