import { apiRequest } from "./client";

export const loginPorter = (username, password) =>
  apiRequest("/porters/login", { method: "POST", body: { username, password } });

export const getPorter = (porterId) => apiRequest(`/porters/${porterId}`);

export const getPorterBookings = (porterId, status) =>
  apiRequest(`/porters/${porterId}/bookings`, { query: { status } });

export const acceptBooking = (porterId, bookingId) =>
  apiRequest(`/porters/${porterId}/bookings/${bookingId}/accept`, { method: "POST" });

export const declineBooking = (porterId, bookingId) =>
  apiRequest(`/porters/${porterId}/bookings/${bookingId}/decline`, { method: "POST" });

export const completeBooking = (porterId, bookingId) =>
  apiRequest(`/porters/${porterId}/bookings/${bookingId}/complete`, { method: "POST" });
