import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { payForBooking } from "../api/bookings";
import { createOrder, verifyPayment } from "../api/payments";
import { loadRazorpayScript } from "../utils/loadRazorpayScript";
import "./PaymentPage.css";

const PAY_ONLINE = "Pay Online (UPI / Card / Netbanking)";
const CASH_ON_SERVICE = "Cash on Service";
const PAYMENT_METHODS = [PAY_ONLINE, CASH_ON_SERVICE];
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

  const finalizeSuccess = (updatedBooking, message) => {
    localStorage.setItem("latestBookingRequest", JSON.stringify(updatedBooking));
    localStorage.setItem("selectedBooking", JSON.stringify(updatedBooking));
    window.alert(message);
    localStorage.removeItem("selectedPorter");
    navigate("/tracking");
  };

  const payWithCash = async (bookingId) => {
    const payload = await payForBooking(bookingId, { paymentMethod: CASH_ON_SERVICE, amount: totalAmount });
    finalizeSuccess(payload.data, "Recorded — pay the porter in cash once the job is done.");
  };

  // Card/UPI details are entered inside Razorpay's own hosted popup and never
  // touch our server. The `handler` callback below is not itself trusted as
  // proof of payment — verifyPayment() re-checks the signature server-side.
  const payOnline = async (bookingId) => {
    await loadRazorpayScript();
    const orderPayload = await createOrder(bookingId);
    const { orderId, amount, currency, keyId } = orderPayload.data;

    return new Promise((resolve, reject) => {
      const razorpay = new window.Razorpay({
        key: keyId,
        order_id: orderId,
        amount,
        currency,
        name: "eKoolie",
        description: "Porter service payment",
        handler: async (response) => {
          try {
            const verifyPayload = await verifyPayment(bookingId, response);
            finalizeSuccess(
              verifyPayload.data,
              "Payment successful. The porter can now complete the booking from their dashboard.",
            );
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: () => resolve(),
        },
        theme: { color: "#b91c1c" },
      });
      razorpay.on("payment.failed", (response) => {
        reject(new Error(response.error?.description || "Payment failed."));
      });
      razorpay.open();
    });
  };

  const handlePay = async () => {
    const bookingId = bookingRecord?._id;
    if (!bookingId) {
      window.alert("No active booking found.");
      return;
    }

    setIsPaying(true);
    try {
      if (selectedMethod === CASH_ON_SERVICE) {
        await payWithCash(bookingId);
      } else {
        await payOnline(bookingId);
      }
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
