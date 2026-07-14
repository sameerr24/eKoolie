import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { getPorter, getPorterBookings, acceptBooking, declineBooking, completeBooking } from "../api/porters";
import "./PorterDashboardPage.css";

const DEFAULT_HINT = "Requests assigned to you will appear here.";

export function PorterDashboardPage() {
  const navigate = useNavigate();

  const [porter, setPorter] = useState(null);
  const [requests, setRequests] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [errorText, setErrorText] = useState(null);
  const [busyAction, setBusyAction] = useState(null);

  const lastRequestIdsRef = useRef([]);
  const requestsListRef = useRef(null);

  const porterId = localStorage.getItem("porterId");
  const porterNameFallback = localStorage.getItem("porterName");

  const refreshDashboard = useCallback(async () => {
    try {
      const [porterPayload, requestedPayload, assignedPayload] = await Promise.all([
        getPorter(porterId),
        getPorterBookings(porterId, "requested"),
        getPorterBookings(porterId, "assigned"),
      ]);

      setPorter(porterPayload.data);
      setActiveBookings(assignedPayload.data || []);

      const newRequests = requestedPayload.data || [];
      const newIds = newRequests.map((b) => b._id);
      const previousIds = lastRequestIdsRef.current;
      const hasNewRequest =
        newIds.length > previousIds.length || newIds.some((id, index) => id !== previousIds[index]);
      lastRequestIdsRef.current = newIds;
      setRequests(newRequests);
      setErrorText(null);

      if (hasNewRequest && newRequests.length > 0) {
        requestAnimationFrame(() =>
          requestsListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        );
      }
    } catch (error) {
      setErrorText(error.message || "Unable to load dashboard data.");
    }
  }, [porterId]);

  useEffect(() => {
    if (!porterId) {
      window.alert("Please login as a porter first.");
      navigate("/login");
      return undefined;
    }

    void refreshDashboard();
    const pollId = window.setInterval(refreshDashboard, 3000);
    return () => window.clearInterval(pollId);
  }, [porterId, navigate, refreshDashboard]);

  const runAction = async (action, bookingId, fallbackMessage) => {
    if (!porterId) return;
    setBusyAction(bookingId);
    try {
      await action(porterId, bookingId);
      await refreshDashboard();
    } catch (error) {
      window.alert(error.message || fallbackMessage);
    } finally {
      setBusyAction(null);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("porterId");
      localStorage.removeItem("porterName");
      localStorage.removeItem("porterUsername");
      navigate("/login");
    }
  };

  if (!porterId) {
    return null;
  }

  const displayName = porter?.name || porterNameFallback || "Porter";
  const hint = errorText || (requests.length > 0 ? `You have ${requests.length} active booking request(s).` : DEFAULT_HINT);
  const requestsCountText = `${requests.length} request${requests.length === 1 ? "" : "s"}`;
  const activeBooking = activeBookings[0];

  return (
    <div className="page porter-dashboard-page">
      <Navbar
        variant="translucent"
        links={[{ href: "/porter-dashboard", label: "Dashboard" }]}
        activeHref="/porter-dashboard"
        actions={
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            Logout
          </button>
        }
      />

      <main className="page-main container dashboard-main">
        <h1 style={{ marginBottom: 4, fontSize: 28 }}>Hello, {displayName}</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 28 }}>Here&apos;s your porter dashboard.</p>

        <div className="grid-3 stat-row">
          <div className="card stat-card">
            <div className="stat-label">Today&apos;s Earnings</div>
            <div className="stat-figure">₹{porter?.earnings ?? 0}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Jobs Completed</div>
            <div className="stat-figure">{porter?.completedBookings ?? 0}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Rating</div>
            <div className="stat-figure">{porter?.rating ? `${porter.rating} ⭐` : "--"}</div>
          </div>
        </div>

        <div className="skills-row">
          {porter?.skills && porter.skills.length > 0 ? (
            porter.skills.map((skill) => (
              <span className="skill-chip" key={skill}>
                {skill}
              </span>
            ))
          ) : (
            <span className="skill-chip">No skills listed</span>
          )}
        </div>

        {activeBooking && (
          <div className="card active-job">
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              Active Job
            </div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{activeBooking.station}</div>
            {activeBooking.specialRequests && (
              <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 10 }}>
                {activeBooking.specialRequests}
              </div>
            )}
            <div style={{ fontSize: 13, color: "var(--text-muted-2)", marginBottom: 16 }}>
              Payment status: {activeBooking.paymentStatus}
            </div>
            <button
              className="btn btn-primary btn-sm"
              disabled={busyAction === activeBooking._id}
              onClick={() => runAction(completeBooking, activeBooking._id, "Unable to complete booking.")}
            >
              Mark as Completed
            </button>
          </div>
        )}

        <div className="requests-header" ref={requestsListRef}>
          <h3 style={{ fontSize: 18 }}>Booking Requests</h3>
          <span className="requests-count">{requestsCountText}</span>
        </div>
        <p className="requests-hint" style={{ color: errorText ? "var(--red)" : "var(--text-muted)" }}>
          {hint}
        </p>

        <div className="requests-list">
          {requests.length === 0 ? (
            <div className="request-empty">No new requests right now.</div>
          ) : (
            requests.map((booking) => (
              <div className="card request-card" key={booking._id}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{booking.station}</div>
                <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 4 }}>
                  {booking.userId} • {booking.userPhone}
                </div>
                <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 10 }}>
                  Fare: ₹{booking.estimatedFare}
                </div>
                {booking.specialRequests && (
                  <div style={{ fontSize: 13, color: "var(--text-muted-2)", marginBottom: 14 }}>
                    {booking.specialRequests}
                  </div>
                )}
                <div className="grid-2">
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={busyAction === booking._id}
                    onClick={() => runAction(declineBooking, booking._id, "Unable to decline booking.")}
                  >
                    Decline
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={busyAction === booking._id}
                    onClick={() => runAction(acceptBooking, booking._id, "Unable to accept booking.")}
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
