import { apiRequest, setAccessToken } from "./client";

export async function registerTraveller({ name, username, email, password }) {
  const payload = await apiRequest("/travellers/register", {
    method: "POST",
    body: { name, username, email, password },
  });
  setAccessToken(payload.accessToken);
  return payload;
}

export async function loginTraveller(username, password) {
  const payload = await apiRequest("/travellers/login", {
    method: "POST",
    body: { username, password },
  });
  setAccessToken(payload.accessToken);
  return payload;
}
