import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "./HomePage.css";

const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#how", label: "How it works" },
  { href: "#why", label: "Why eKoolie" },
  { href: "#community", label: "Community" },
];

const HOW_IT_WORKS = [
  {
    title: "Search Station",
    body: "Type your arrival station or select from recent stations to find available Koolie nearby.",
  },
  {
    title: "Select Verified Koolie",
    body: "Choose from licensed Koolie with ratings, ID verification and fare per bag — or let eKoolie auto-assign one.",
  },
  {
    title: "Relax — Koolie Arrives",
    body: "Track your Koolie in-app, confirm arrival, pay securely or cash on service, and leave a rating afterward.",
  },
];

const WHY_EKOOLIE = [
  {
    title: "Verified Koolie",
    body: "All Koolie are licensed and background-checked with displayed ID numbers and verification badges.",
  },
  {
    title: "Transparent Pricing",
    body: "Clear fare breakdown by bag or weight plus optional tipping — no hidden fees.",
  },
  {
    title: "Live Tracking",
    body: "See Koolie location and ETA in real-time once they accept your job.",
  },
];

const STORIES = [
  {
    tag: "STATION HELP",
    title: "Helping with heavy bags",
    quote: "“Quick, polite and efficient — saved us a lot of time.” — Rohit",
    image:
      "https://images.hindustantimes.com/rf/image_size_630x354/HT/p2/2018/06/05/Pictures/passengers-station-along-railway-platform-carrying-luggage_c7ccd1bc-68bc-11e8-8033-47bccc77d658.jpg",
  },
  {
    tag: "KOOLIE RATING",
    title: "Verified and trusted",
    quote: "“Profile showed licence and reviews — felt safe.” — Meera",
    image: "https://im.rediff.com/news/2018/may/27coolie5.jpg?w=450&h=450",
  },
  {
    tag: "ON-TIME",
    title: "Arrived before train",
    quote: "“Punctual and friendly — great service.” — Ananya",
    image:
      "https://t3.ftcdn.net/jpg/03/55/57/92/360_F_355579231_zxxhlUgUOUAIhrvxtEMYqjkEaZaUSUDI.jpg",
  },
];

const INITIAL_ACTIVITY = [
  {
    id: "seed-1",
    initials: "RD",
    color: "#d1293d",
    name: "Rohit D.",
    time: "5 minutes ago",
    text: "Saved me a long carry between platforms — highly recommend!",
  },
  {
    id: "seed-2",
    initials: "SM",
    color: "#3f8fe0",
    name: "Sana M.",
    time: "1 hour ago",
    text: "Easy booking and transparent pricing — quick and safe.",
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const revealRef = useScrollReveal();

  const [activeHref, setActiveHref] = useState("#home");
  const [activity, setActivity] = useState(INITIAL_ACTIVITY);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState("");

  const handleNavClick = useCallback((event, link) => {
    event.preventDefault();
    const target = document.querySelector(link.href);
    if (target) {
      window.scrollTo({ top: target.offsetTop - 20, behavior: "smooth" });
      setActiveHref(link.href);
    }
  }, []);

  const handleBookClick = useCallback(
    (event) => {
      event.preventDefault();
      if (
        window.confirm(
          "Please Login or Sign Up to book a porter.\n\nClick OK to proceed to the Login page.",
        )
      ) {
        navigate("/login");
      }
    },
    [navigate],
  );

  const handlePostReview = () => {
    if (!reviewText.trim()) {
      window.alert("Please enter a review before posting.");
      return;
    }

    setActivity((current) => [
      ...current,
      {
        id: `you-${Date.now()}`,
        initials: "YOU",
        color: "#34b364",
        name: "You",
        time: "Just now",
        text: reviewText,
      },
    ]);
    setReviewText("");
    setShowReviewForm(false);
  };

  const handleDeleteReview = (id) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      setActivity((current) => current.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="page home-page" ref={revealRef}>
      <section id="home" className="hero">
        <Navbar
          variant="transparent"
          links={NAV_LINKS}
          activeHref={activeHref}
          onLinkClick={handleNavClick}
          actions={
            <>
              <a href="/login" className="btn btn-outline btn-on-hero">
                Login
              </a>
              <a href="/login" className="btn btn-primary">
                Sign Up
              </a>
            </>
          }
        />

        <div className="hero-inner container">
          <div className="eyebrow">Railway Porter Booking</div>
          <h1 className="hero-headline">
            Your journey,
            <br />
            <em>carried with care.</em>
          </h1>
          <p className="hero-sub">
            eKoolie connects travellers to licensed coolies (Koolie) so you can move through
            stations without the burden of heavy luggage. Quick booking, transparent fares, and
            verified Koolie for peace of mind.
          </p>
          <a href="#" className="btn btn-primary btn-lg" onClick={handleBookClick}>
            Book a Koolie
          </a>
        </div>
      </section>

      <main className="page-main">
        <section id="how" className="section container">
          <div className="eyebrow">How it works</div>
          <h2 className="section-heading">Simple three-step booking to get a Koolie at your platform.</h2>

          <div className="grid-3" style={{ marginTop: 40 }}>
            {HOW_IT_WORKS.map((item, index) => (
              <div className="card reveal" key={item.title}>
                <div className="step-index">{String(index + 1).padStart(2, "0")}</div>
                <h3 style={{ marginTop: 18, marginBottom: 10, fontSize: 20 }}>{item.title}</h3>
                <p style={{ color: "var(--text-muted)" }}>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="why" className="section container">
          <div className="eyebrow">Why choose eKoolie?</div>
          <h2 className="section-heading">Designed for travellers — safe, reliable, and affordable.</h2>

          <div className="grid-3" style={{ marginTop: 40 }}>
            {WHY_EKOOLIE.map((item) => (
              <div className="card reveal" key={item.title}>
                <h3 style={{ marginBottom: 10, fontSize: 20 }}>{item.title}</h3>
                <p style={{ color: "var(--text-muted)" }}>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section container">
          <div className="eyebrow">Real journeys</div>
          <h2 className="section-heading">Photos from travellers and Koolie — real journeys, real help.</h2>

          <div className="grid-3" style={{ marginTop: 40 }}>
            {STORIES.map((story) => (
              <div className="story-card reveal" key={story.title}>
                <div className="story-image" style={{ backgroundImage: `url("${story.image}")` }} />
                <div className="story-tag">{story.tag}</div>
                <h3 style={{ margin: "8px 0" }}>{story.title}</h3>
                <p style={{ color: "var(--text-muted)" }}>{story.quote}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="community" className="section container">
          <div className="eyebrow">Community</div>
          <h2 className="section-heading">Share feedback, vote in quick polls, and mark favourite Koolie.</h2>

          <div className="grid-2" style={{ marginTop: 40, alignItems: "start" }}>
            <div className="card reveal">
              <h3 style={{ marginBottom: 16, fontSize: 18 }}>Recent Activity</h3>
              <div className="activity-list">
                {activity.map((item) => (
                  <div className="activity" key={item.id}>
                    <div className="activity-head">
                      <div className="avatar" style={{ background: item.color }}>
                        {item.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted-2)" }}>{item.time}</div>
                      </div>
                    </div>
                    <div style={{ color: "var(--text-muted)" }}>&quot;{item.text}&quot;</div>
                    {item.id.startsWith("you-") && (
                      <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleDeleteReview(item.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="review-section">
                {!showReviewForm ? (
                  <button className="btn btn-outline" onClick={() => setShowReviewForm(true)}>
                    Add a review
                  </button>
                ) : (
                  <div className="review-form">
                    <textarea
                      className="review-input"
                      rows={3}
                      placeholder="Write your review here..."
                      value={reviewText}
                      onChange={(event) => setReviewText(event.target.value)}
                      autoFocus
                    />
                    <div className="review-actions">
                      <button className="btn btn-primary" onClick={handlePostReview}>
                        Post
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => {
                          setReviewText("");
                          setShowReviewForm(false);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card reveal">
              <h3 style={{ marginBottom: 16, fontSize: 18 }}>Contact &amp; Support</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: 14 }}>
                Have questions or want to register as a Koolie? Reach us at:
              </p>
              <p style={{ fontWeight: 700, marginBottom: 8 }}>support@ekoolie.in</p>
              <p style={{ color: "var(--text-muted)" }}>Or call: +91 98765 43210</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
