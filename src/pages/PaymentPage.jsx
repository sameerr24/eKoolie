import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLegacyPage } from "../legacy/useLegacyPage";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5001/api";

const PAYMENT_HTML = `
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
  <div class="card">
    <h2 style="margin-top: 0">Payment Details</h2>

    <div style="margin-bottom: 16px; color: var(--muted); line-height: 1.5;">
      Review the selected porter before confirming payment.
    </div>

    <div class="payment-summary">
      <div class="summary-row"><span>Porter Service (<span id="paymentPorterName">Sumit Kumar</span>)</span><span id="paymentPorterFare">₹150</span></div>
      <div class="summary-row"><span>Platform Fee</span><span>₹20</span></div>
      <div class="summary-row total"><span>Total Amount</span><span id="paymentTotalAmount">₹170</span></div>
    </div>

    <h3 style="font-size: 16px; margin-bottom: 16px">Select Payment Method</h3>
    <div class="payment-methods">
      <div class="method-option selected" onclick="selectMethod(this)"><div class="radio"></div><span>UPI / QR Code</span></div>
      <div class="method-option" onclick="selectMethod(this)"><div class="radio"></div><span>Credit / Debit Card</span></div>
      <div class="method-option" onclick="selectMethod(this)"><div class="radio"></div><span>Cash on Service</span></div>
    </div>

    <button id="payBtn" type="button" class="btn btn-primary" onclick="completePayment()">Pay ₹170</button>
  </div>
</main>
`;

export function PaymentPage() {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const setup = useCallback(() => {
    const previousFns = {
      selectMethod: window.selectMethod,
      completePayment: window.completePayment,
    };

    const selectedPorter = (() => {
      try {
        return JSON.parse(localStorage.getItem("selectedPorter") || "null");
      } catch (error) {
        return null;
      }
    })();

    const porterName =
      selectedPorter?.name || selectedPorter?.porterName || "Sumit Kumar";
    const porterFare = selectedPorter?.fare ?? 150;
    const selectedBooking = (() => {
      try {
        return JSON.parse(localStorage.getItem("selectedBooking") || "null");
      } catch (error) {
        return null;
      }
    })();
    const latestBooking = (() => {
      try {
        return JSON.parse(localStorage.getItem("latestBookingRequest") || "null");
      } catch (error) {
        return null;
      }
    })();
    const bookingRecord = selectedBooking || latestBooking;
    const bookingFare = bookingRecord?.estimatedFare;
    const platformFee = 20;
    const totalAmount = (bookingFare ?? porterFare) + platformFee;

    const porterNameElement = document.querySelector("#paymentPorterName");
    const porterFareElement = document.querySelector("#paymentPorterFare");
    const totalAmountElement = document.querySelector("#paymentTotalAmount");
    const payBtn = document.querySelector("#payBtn");

    if (porterNameElement) {
      porterNameElement.textContent = porterName;
    }

    if (porterFareElement) {
      porterFareElement.textContent = `₹${bookingFare ?? porterFare}`;
    }

    if (totalAmountElement) {
      totalAmountElement.textContent = `₹${totalAmount}`;
    }

    if (payBtn) {
      payBtn.textContent = `Pay ₹${totalAmount}`;
    }

    window.selectMethod = (element) => {
      document
        .querySelectorAll(".method-option")
        .forEach((option) => option.classList.remove("selected"));
      element.classList.add("selected");
    };

    window.completePayment = () => {
      const bookingId = bookingRecord?._id;

      if (!bookingId) {
        alert("No active booking found.");
        return;
      }

      fetch(`${API_BASE_URL}/bookings/${bookingId}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod:
            document.querySelector(".method-option.selected span")?.textContent?.trim() ||
            "UPI / QR Code",
          amount: totalAmount,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || "Payment could not be recorded.");
          }

          return response.json();
        })
        .then((payload) => {
          localStorage.setItem(
            "latestBookingRequest",
            JSON.stringify(payload.data),
          );
          localStorage.setItem("selectedBooking", JSON.stringify(payload.data));
          alert(
            "Payment successful. The porter can now complete the booking from their dashboard.",
          );
          localStorage.removeItem("selectedPorter");
          navigate("/book");
        })
        .catch((error) => {
          alert(error.message || "Payment failed.");
        });
    };

    return () => {
      window.selectMethod = previousFns.selectMethod;
      window.completePayment = previousFns.completePayment;
    };
  }, [navigate]);

  useLegacyPage({ containerRef, html: PAYMENT_HTML, navigate, setup });

  return <div ref={containerRef} />;
}
