import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { getAccessToken } from "../api/client";
import { getBooking, getBookingLocation, cancelBooking } from "../api/bookings";
import { PorterLocationMap } from "../components/PorterLocationMap";
import "./TrackingPage.css";

function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

const NAV_LINKS = [{ href: "/book", label: "Book Porter" }];

export function TrackingPage() {
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [porterCoordinates, setPorterCoordinates] = useState(null);
  const [deferredPayment, setDeferredPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const pollTimerRef = useRef(null);

  const pollStatus = useCallback(async (bookingId) => {
    try {
      const payload = await getBooking(bookingId);
      const nextBooking = payload.data;
      if (!nextBooking) return;

      setBooking(nextBooking);
      localStorage.setItem("latestBookingRequest", JSON.stringify(nextBooking));
      localStorage.setItem("selectedBooking", JSON.stringify(nextBooking));

      const isActiveJob = nextBooking.status === "assigned" || nextBooking.status === "in_progress";
      if (isActiveJob) {
        getBookingLocation(nextBooking._id)
          .then((locationPayload) => setPorterCoordinates(locationPayload.data.coordinates))
          .catch((error) => console.warn("Location poll failed:", error));
      } else {
        setPorterCoordinates(null);
      }
    } catch (error) {
      console.warn("Booking status poll failed:", error);
    }
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    const persisted = readJSON("latestBookingRequest");
    if (!persisted?._id) {
      setNotFound(true);
      return;
    }

    void pollStatus(persisted._id);
    pollTimerRef.current = window.setInterval(() => void pollStatus(persisted._id), 4000);

    return () => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToPayment = () => {
    if (booking?._id) {
      localStorage.setItem("selectedBooking", JSON.stringify(booking));
    }
    navigate("/payment");
  };

  const handleCancel = async () => {
    if (!booking?._id || !window.confirm("Cancel this request?")) return;
    setIsCancelling(true);
    try {
      const payload = await cancelBooking(booking._id);
      setBooking(payload.data);
      localStorage.setItem("latestBookingRequest", JSON.stringify(payload.data));
      localStorage.setItem("selectedBooking", JSON.stringify(payload.data));
    } catch (error) {
      window.alert(error.message || "Unable to cancel this request.");
    } finally {
      setIsCancelling(false);
    }
  };

  const porterName = booking?.assignedPorter?.name || "your porter";
  const isActiveJob = booking?.status === "assigned" || booking?.status === "in_progress";
  const isPaid = booking?.paymentStatus === "paid";

  return (
    <div className="page tracking-page">
      <Navbar variant="translucent" links={NAV_LINKS} activeHref="/book" />

      <main className="page-main container tracking-main">
        <Link to="/book" className="tracking-back-link">
          ← Back to search
        </Link>

        {notFound && (
          <div className="card tracking-card">
            <h2 style={{ marginBottom: 12 }}>No active booking</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              You don't have a booking request in progress right now.
            </p>
            <Link to="/book" className="btn btn-primary">
              Book a Porter
            </Link>
          </div>
        )}

        {!notFound && !booking && (
          <div className="card tracking-card">
            <p style={{ color: "var(--text-muted)" }}>Loading your booking status...</p>
          </div>
        )}

        {!notFound && booking && (
          <div className="card tracking-card">
            <h1 style={{ marginBottom: 8, fontSize: 26 }}>Tracking Your Porter</h1>
            <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              Booking ID: {booking._id} • {booking.station}
            </p>

            {booking.status === "requested" && (
              <div className="status-card">
                <div className="status-card-title">Waiting for porter to accept</div>
                <div>Your request is live. We'll keep checking for the porter's response.</div>
                <div className="status-card-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => void pollStatus(booking._id)}
                  >
                    Check Status
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling ? "Cancelling..." : "Cancel Request"}
                  </button>
                </div>
              </div>
            )}

            {booking.status === "cancelled" && (
              <div className="status-card">
                <div className="status-card-title">Request cancelled</div>
                <div>This booking is no longer active. Search again to request another porter.</div>
                <div className="status-card-actions">
                  <Link to="/book" className="btn btn-primary btn-sm">
                    Book Another Porter
                  </Link>
                </div>
              </div>
            )}

            {isActiveJob && (
              <div className="status-card">
                <div className="status-card-title">
                  {isPaid ? "Payment complete — porter is on the way" : `${porterName} has accepted your request`}
                </div>
                <div>
                  {isPaid
                    ? "The porter has been notified and is finishing the job."
                    : "Live location will appear below as soon as the porter starts sharing it."}
                </div>

                <PorterLocationMap coordinates={porterCoordinates} />

                {!isPaid && !deferredPayment && (
                  <div className="status-card-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={goToPayment}>
                      Pay Now
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setDeferredPayment(true)}>
                      Pay Later
                    </button>
                  </div>
                )}
                {!isPaid && deferredPayment && (
                  <div className="status-card-actions tracking-deferred-row">
                    <button type="button" className="btn btn-outline btn-sm" onClick={goToPayment}>
                      Pay Now
                    </button>
                    <span className="tracking-deferred-note">You chose to pay after the job is done.</span>
                  </div>
                )}
              </div>
            )}

            {booking.status === "completed" && (
              <div className="status-card">
                <div className="status-card-title">{isPaid ? "All done!" : "Job completed"}</div>
                <div>
                  {isPaid
                    ? "Thanks for using eKoolie. We hope your journey was smooth."
                    : "The porter has finished the job. Please complete your payment to wrap up."}
                </div>
                <div className="status-card-actions">
                  {!isPaid && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={goToPayment}>
                      Pay Now
                    </button>
                  )}
                  {isPaid && (
                    <Link to="/book" className="btn btn-primary btn-sm">
                      Book Another Porter
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
