import { apiRequest, setAccessToken } from "./client";

export const loginPorter = async (username, password) => {
  const payload = await apiRequest("/porters/login", { method: "POST", body: { username, password } });
  setAccessToken(payload.accessToken);
  return payload;
};

export const getPorter = (porterId) => apiRequest(`/porters/${porterId}`);

export const getPorterBookings = (porterId, status) =>
  apiRequest(`/porters/${porterId}/bookings`, { query: { status } });

export const acceptBooking = (porterId, bookingId) =>
  apiRequest(`/porters/${porterId}/bookings/${bookingId}/accept`, { method: "POST" });

export const declineBooking = (porterId, bookingId) =>
  apiRequest(`/porters/${porterId}/bookings/${bookingId}/decline`, { method: "POST" });

export const completeBooking = (porterId, bookingId) =>
  apiRequest(`/porters/${porterId}/bookings/${bookingId}/complete`, { method: "POST" });

export const updateBookingLocation = (porterId, bookingId, latitude, longitude) =>
  apiRequest(`/porters/${porterId}/bookings/${bookingId}/location`, {
    method: "PATCH",
    body: { latitude, longitude },
  });
