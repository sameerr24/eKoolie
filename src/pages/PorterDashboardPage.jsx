import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { getAccessToken } from "../api/client";
import { logout as logoutRequest } from "../api/auth";
import {
  getPorter,
  getPorterBookings,
  acceptBooking,
  declineBooking,
  completeBooking,
  updateBookingLocation,
} from "../api/porters";
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
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const watchIdRef = useRef(null);
  const lastSentAtRef = useRef(0);

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
    if (!porterId || !getAccessToken()) {
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

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logoutRequest().catch(() => {});
      localStorage.removeItem("porterId");
      localStorage.removeItem("porterName");
      localStorage.removeItem("porterUsername");
      navigate("/login");
    }
  };

  const stopSharingLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharingLocation(false);
  };

  const toggleLocationSharing = () => {
    if (isSharingLocation) {
      stopSharingLocation();
      return;
    }

    const activeBookingId = activeBookings[0]?._id;
    if (!navigator.geolocation || !porterId || !activeBookingId) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastSentAtRef.current < 10000) return; // throttle real pushes to ~10s apart
        lastSentAtRef.current = now;
        updateBookingLocation(
          porterId,
          activeBookingId,
          position.coords.latitude,
          position.coords.longitude,
        ).catch((error) => console.warn("Failed to push location:", error));
      },
      (error) => {
        window.alert(error.message || "Unable to get your location.");
        stopSharingLocation();
      },
      { enableHighAccuracy: true, maximumAge: 0 },
    );
    setIsSharingLocation(true);
  };

  // Stop sharing if the active job disappears (completed/declined elsewhere) or on unmount
  useEffect(() => {
    if (activeBookings.length === 0 && watchIdRef.current !== null) {
      stopSharingLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBookings]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

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
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="btn btn-primary btn-sm"
                disabled={busyAction === activeBooking._id}
                onClick={() => runAction(completeBooking, activeBooking._id, "Unable to complete booking.")}
              >
                Mark as Completed
              </button>
              <button
                type="button"
                className={`btn btn-sm ${isSharingLocation ? "btn-primary" : "btn-outline"}`}
                onClick={toggleLocationSharing}
              >
                {isSharingLocation ? "● Sharing location" : "Share my location"}
              </button>
            </div>
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
                  Contact: {booking.userPhone}
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
