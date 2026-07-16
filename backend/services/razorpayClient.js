// Razorpay Standard Checkout — the client never sees RAZORPAY_KEY_SECRET;
// only createOrder()'s returned keyId (public) reaches the frontend.
// verifySignature() is the security-critical step: Razorpay's `handler`
// callback firing on the client is never itself treated as proof of payment.

const crypto = require("crypto");
const Razorpay = require("razorpay");

let client = null;
function getClient() {
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

// amountRupees is a plain rupee amount computed server-side by the caller —
// Razorpay's API takes the smallest currency unit (paise).
async function createOrder(amountRupees, receipt) {
  try {
    const order = await getClient().orders.create({
      amount: Math.round(amountRupees * 100),
      currency: "INR",
      receipt,
    });
    return order;
  } catch (err) {
    // The SDK throws Razorpay's raw { statusCode, error: { description } }
    // shape, not an Error instance — err.message is otherwise undefined and
    // the real reason (e.g. "Authentication failed") gets lost as a blank
    // "Server error" by the time it reaches errorHandler.js.
    const description = err?.error?.description || err?.message || "Razorpay order creation failed";
    const wrapped = new Error(description);
    wrapped.status = err?.statusCode && err.statusCode < 500 ? 502 : 500;
    throw wrapped;
  }
}

// Razorpay's documented Standard Checkout verification: HMAC-SHA256 of
// "order_id|payment_id" using the key secret, compared to the signature
// Razorpay sent back. Constant-time compare to avoid timing side-channels.
function verifySignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(String(signature || ""), "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

module.exports = { createOrder, verifySignature };
