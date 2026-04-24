import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLegacyPage } from "../legacy/useLegacyPage";

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

<main class="main">
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
        <input id="station" type="text" class="form-input" placeholder="e.g. New Delhi" required />
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
        <h3 style="margin: 0 0 8px 0; color: var(--cyan)">Porter Assigned!</h3>
        <p style="margin: 0; color: var(--muted)">We found a verified porter available for your arrival.</p>

        <div class="porter-preview">
          <div class="porter-avatar"></div>
          <div>
            <div style="font-weight: 700; font-size: 18px">Sumit Kumar</div>
            <div style="color: var(--muted); font-size: 14px">ID: KL-2024-89 • ⭐ 4.8</div>
          </div>
        </div>

        <div class="grid-2">
          <a href="porter_profile.html" class="btn btn-outline" style="text-align: center">View Details</a>
          <a href="payment.html" class="btn btn-primary" style="text-align: center">Pay Now</a>
        </div>
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
      };

      const username = localStorage.getItem("username");
      if (username) {
        const greetingElement = container.querySelector("#userGreeting");
        if (greetingElement) {
          greetingElement.textContent = `Hello ${username}`;
        }
      }

      window.handleSearch = (event) => {
        event.preventDefault();
        const btn = event.target.querySelector('button[type="submit"]');
        if (!btn) {
          return false;
        }

        const originalText = btn.innerText;
        btn.innerText = "Searching...";
        btn.style.opacity = "0.7";

        setTimeout(() => {
          btn.innerText = originalText;
          btn.style.opacity = "1";
          const resultSection = container.querySelector("#resultSection");
          resultSection?.classList.remove("hidden");
          resultSection?.scrollIntoView({ behavior: "smooth" });
        }, 1500);

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
      };
    },
    [navigate],
  );

  useLegacyPage({ containerRef, html: BOOK_HTML, navigate, setup });

  return <div ref={containerRef} />;
}
