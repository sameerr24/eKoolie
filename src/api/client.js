export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5001/api";

const ACCESS_TOKEN_KEY = "accessToken";

let accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

function buildUrl(path, query) {
  let url = `${API_BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, value]) => value !== undefined && value !== null),
    );
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

async function rawFetch(path, { method, body, query }) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // sends the httpOnly refresh cookie on /auth/* calls
  });

  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

// Concurrent 401s share one refresh call instead of each firing their own.
let refreshInFlight = null;

function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Session expired");
        }
        const payload = await response.json();
        setAccessToken(payload.accessToken);
        return payload.accessToken;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

// Thin fetch wrapper: builds the URL, JSON-encodes the body, attaches the
// access token, and transparently refreshes+retries once on a 401 caused by
// access-token expiry. Throws an Error with the server's message (or a
// fallback) on any response that's still not OK afterward.
export async function apiRequest(path, options = {}) {
  const { method = "GET", body, query } = options;
  let { response, payload } = await rawFetch(path, { method, body, query });

  if (!response.ok && response.status === 401 && payload.code === "TOKEN_EXPIRED") {
    try {
      await refreshAccessToken();
    } catch {
      setAccessToken(null);
      window.dispatchEvent(new Event("ekoolie:auth-expired"));
      throw new Error("Your session has expired. Please log in again.");
    }

    ({ response, payload } = await rawFetch(path, { method, body, query }));
  }

  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }

  return payload;
}
