import { apiRequest } from "./client";

export const findNearestPorters = ({ longitude, latitude, maxDistance, station, limit }) =>
  apiRequest("/bookings/nearest-porters", {
    query: { longitude, latitude, maxDistance, station, limit },
  });

export const requestBooking = (booking) =>
  apiRequest("/bookings/request", { method: "POST", body: booking });

export const getBooking = (bookingId) => apiRequest(`/bookings/${bookingId}`);

export const payForBooking = (bookingId, { paymentMethod, amount }) =>
  apiRequest(`/bookings/${bookingId}/payment`, {
    method: "POST",
    body: { paymentMethod, amount },
  });

export const getBookingLocation = (bookingId) => apiRequest(`/bookings/${bookingId}/location`);

export const cancelBooking = (bookingId) => apiRequest(`/bookings/${bookingId}/cancel`, { method: "POST" });
