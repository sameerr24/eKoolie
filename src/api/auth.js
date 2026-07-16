import { apiRequest, setAccessToken } from "./client";

export async function logout() {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
  }
}
