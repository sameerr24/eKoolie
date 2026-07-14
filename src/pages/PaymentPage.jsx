import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { payForBooking } from "../api/bookings";
import "./PaymentPage.css";

const PAYMENT_METHODS = ["UPI / QR Code", "Credit / Debit Card", "Cash on Service"];
const PLATFORM_FEE = 20;

function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

export function PaymentPage() {
  const navigate = useNavigate();

  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [isPaying, setIsPaying] = useState(false);

  const selectedPorter = readJSON("selectedPorter");
  const bookingRecord = readJSON("selectedBooking") || readJSON("latestBookingRequest");

  const porterName = selectedPorter?.name || selectedPorter?.porterName || "Sumit Kumar";
  const porterFare = selectedPorter?.fare ?? 150;
  const bookingFare = bookingRecord?.estimatedFare;
  const totalAmount = (bookingFare ?? porterFare) + PLATFORM_FEE;

  const handlePay = async () => {
    const bookingId = bookingRecord?._id;
    if (!bookingId) {
      window.alert("No active booking found.");
      return;
    }

    setIsPaying(true);
    try {
      const payload = await payForBooking(bookingId, { paymentMethod: selectedMethod, amount: totalAmount });
      localStorage.setItem("latestBookingRequest", JSON.stringify(payload.data));
      localStorage.setItem("selectedBooking", JSON.stringify(payload.data));
      window.alert("Payment successful. The porter can now complete the booking from their dashboard.");
      localStorage.removeItem("selectedPorter");
      navigate("/book");
    } catch (error) {
      window.alert(error.message || "Payment failed.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="page payment-page">
      <Navbar links={[{ href: "/book", label: "Book Porter" }]} activeHref="/book" />

      <main className="page-main container payment-main">
        <div className="card payment-card">
          <h2 style={{ marginBottom: 12 }}>Payment Details</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
            Review the selected porter before confirming payment.
          </p>

          <div className="payment-summary">
            <div className="summary-row">
              <span>Porter Service ({porterName})</span>
              <span>₹{bookingFare ?? porterFare}</span>
            </div>
            <div className="summary-row">
              <span>Platform Fee</span>
              <span>₹{PLATFORM_FEE}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount</span>
              <span>₹{totalAmount}</span>
            </div>
          </div>

          <h3 style={{ fontSize: 15, margin: "24px 0 14px" }}>Select Payment Method</h3>
          <div className="payment-methods">
            {PAYMENT_METHODS.map((method) => (
              <div
                key={method}
                className={`method-option${selectedMethod === method ? " selected" : ""}`}
                onClick={() => setSelectedMethod(method)}
              >
                <div className="radio" />
                <span>{method}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-primary btn-block" style={{ marginTop: 24 }} onClick={handlePay} disabled={isPaying}>
            {isPaying ? "Processing..." : `Pay ₹${totalAmount}`}
          </button>
        </div>
      </main>
    </div>
  );
}
