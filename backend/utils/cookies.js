const { refreshExpiryDate } = require("./tokens");

const REFRESH_COOKIE_NAME = "refreshToken";

function setRefreshCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    // Cross-site in prod (frontend/backend on different domains) requires
    // SameSite=None, which browsers only honor alongside Secure.
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    expires: refreshExpiryDate(),
    path: "/api/auth",
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
}

module.exports = { REFRESH_COOKIE_NAME, setRefreshCookie, clearRefreshCookie };
