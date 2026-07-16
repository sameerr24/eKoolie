import { apiRequest } from "./client";

export const createOrder = (bookingId) =>
  apiRequest(`/bookings/${bookingId}/create-order`, { method: "POST" });

export const verifyPayment = (bookingId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) =>
  apiRequest(`/bookings/${bookingId}/verify-payment`, {
    method: "POST",
    body: { razorpay_order_id, razorpay_payment_id, razorpay_signature },
  });
