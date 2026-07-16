const asyncHandler = require("../middleware/asyncHandler");
const Booking = require("../models/Booking");
const { createOrder, verifySignature } = require("../services/razorpayClient");

const PLATFORM_FEE = 20; // mirrors PaymentPage.jsx's displayed total exactly

// POST /bookings/:bookingId/create-order — traveller starts an online payment
exports.createOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.userId !== req.user.id) {
    return res.status(403).json({ error: "This booking does not belong to you" });
  }
  if (booking.paymentStatus === "paid") {
    return res.status(400).json({ error: "Booking already paid" });
  }

  // The amount is derived entirely from the booking record already stored in
  // our DB — never from anything the client sends — so nothing short of
  // compromising the DB itself can change what gets charged.
  const amount = Number(booking.estimatedFare || 0) + PLATFORM_FEE;

  const order = await createOrder(amount, bookingId);

  res.json({
    data: {
      orderId: order.id,
      amount: order.amount, // paise, echoed back so the frontend never re-derives it
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// POST /bookings/:bookingId/verify-payment — body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// The one security-critical endpoint: paymentStatus only ever becomes "paid"
// here, and only once the signature has been independently recomputed.
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "razorpay_order_id, razorpay_payment_id and razorpay_signature are required" });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.userId !== req.user.id) {
    return res.status(403).json({ error: "This booking does not belong to you" });
  }

  const isValid = verifySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    return res.status(400).json({ error: "Payment signature verification failed" });
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    {
      paymentStatus: "paid",
      paymentOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    },
    { new: true },
  ).populate("assignedPorter");

  res.json({ message: "Payment verified successfully", data: updatedBooking });
});
