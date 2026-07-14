import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import "./PorterProfilePage.css";

const REVIEWS = [
  {
    name: "Amit S.",
    stars: "★★★★★",
    text: "Very helpful and polite. Arrived exactly on time at the coach.",
  },
  {
    name: "Priya M.",
    stars: "★★★★☆",
    text: "Good service, handled fragile luggage carefully.",
  },
];

export function PorterProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="page profile-page">
      <Navbar links={[{ href: "/book", label: "Book Porter" }]} activeHref="/book" />

      <main className="page-main container profile-main">
        <div className="card profile-card">
          <div className="profile-header">
            <div className="profile-photo" />
            <div className="profile-info">
              <span className="badge">Verified License #KL-2024-89</span>
              <h1 style={{ margin: "10px 0" }}>Sumit Kumar</h1>
              <p style={{ color: "var(--text-muted)", marginBottom: 18 }}>
                Speaking: Hindi, English, Marathi
              </p>
              <div className="profile-actions">
                <button type="button" className="btn btn-primary" onClick={() => navigate("/payment")}>
                  Proceed to Pay
                </button>
                <button type="button" className="btn btn-outline" onClick={() => navigate("/book")}>
                  Back
                </button>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <h4>Rating</h4>
              <div className="stat-value">
                4.8 <span style={{ fontSize: 16, color: "var(--gold)" }}>★</span>
              </div>
            </div>
            <div className="stat-item">
              <h4>Trips Completed</h4>
              <div className="stat-value">1,240+</div>
            </div>
            <div className="stat-item">
              <h4>Experience</h4>
              <div className="stat-value">5 Years</div>
            </div>
          </div>

          <h3 style={{ marginBottom: 16, fontSize: 18 }}>Recent Reviews</h3>
          <div className="reviews-list">
            {REVIEWS.map((review) => (
              <div className="review-item" key={review.name}>
                <div className="review-head">
                  <span style={{ fontWeight: 600 }}>{review.name}</span>
                  <span className="stars">{review.stars}</span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
