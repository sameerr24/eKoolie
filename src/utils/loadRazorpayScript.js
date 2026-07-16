// Loads Razorpay's Checkout.js once and caches the promise, so mounting
// PaymentPage repeatedly never injects the <script> tag more than once.
let loadPromise = null;

export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay checkout script."));
      document.body.appendChild(script);
    });
  }

  return loadPromise;
}
