export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5001/api";

// Thin fetch wrapper: builds the URL, JSON-encodes the body, and throws an
// Error with the server's message (or a fallback) on non-OK responses.
export async function apiRequest(path, { method = "GET", body, query } = {}) {
  let url = `${API_BASE_URL}${path}`;

  if (query) {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, value]) => value !== undefined && value !== null),
    );
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }

  return payload;
}
