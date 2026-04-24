import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLegacyPage } from "../legacy/useLegacyPage";

const PROFILE_HTML = `
<aside class="sidebar">
  <div class="sidebar-logo">
    <div class="logo-badge"><span style="font-size: 20px">🚂</span></div>
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
</aside>

<main class="main">
  <div class="card" style="max-width: 800px; margin: 0 auto">
    <div class="profile-header">
      <div class="profile-img"></div>
      <div class="profile-info">
        <span class="badge">Verified License #KL-2024-89</span>
        <h1>Sumit Kumar</h1>
        <p style="color: var(--muted); margin: 0 0 16px 0">Speaking: Hindi, English, Marathi</p>
        <div style="display: flex; gap: 12px">
          <button id="proceedPayBtn" type="button" class="btn btn-primary">Proceed to Pay</button>
          <button id="backBtn" type="button" class="btn btn-outline">Back</button>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-item"><h4>Rating</h4><div class="value">4.8 <span style="font-size: 16px; color: #f59e0b">★</span></div></div>
      <div class="stat-item"><h4>Trips Completed</h4><div class="value">1,240+</div></div>
      <div class="stat-item"><h4>Experience</h4><div class="value">5 Years</div></div>
    </div>

    <h3 style="margin-bottom: 16px">Recent Reviews</h3>
    <div class="reviews-list">
      <div class="review-item">
        <div class="review-header"><span style="font-weight: 600">Amit S.</span><span class="stars">★★★★★</span></div>
        <p style="color: var(--muted); margin: 0; font-size: 14px">Very helpful and polite. Arrived exactly on time at the coach.</p>
      </div>
      <div class="review-item">
        <div class="review-header"><span style="font-weight: 600">Priya M.</span><span class="stars">★★★★☆</span></div>
        <p style="color: var(--muted); margin: 0; font-size: 14px">Good service, handled fragile luggage carefully.</p>
      </div>
    </div>
  </div>
</main>
`;

export function PorterProfilePage() {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const setup = useCallback(
    ({ container }) => {
      const onProceedPay = () => navigate("/payment");
      const onBack = () => navigate("/book");

      container.querySelector("#proceedPayBtn")?.addEventListener("click", onProceedPay);
      container.querySelector("#backBtn")?.addEventListener("click", onBack);

      return () => {
        container
          .querySelector("#proceedPayBtn")
          ?.removeEventListener("click", onProceedPay);
        container.querySelector("#backBtn")?.removeEventListener("click", onBack);
      };
    },
    [navigate],
  );

  useLegacyPage({ containerRef, html: PROFILE_HTML, navigate, setup });

  return <div ref={containerRef} />;
}
