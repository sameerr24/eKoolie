const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || "7d";

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in .env");
}

// Access token: short-lived, sent as Authorization: Bearer <token>.
function signAccessToken({ id, role }) {
  return jwt.sign({ id, role }, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

// Refresh token: long-lived, delivered as an httpOnly cookie. A separate
// secret means a leaked access token can't be used to mint a refresh token.
function signRefreshToken({ id, role }) {
  return jwt.sign({ id, role }, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

// Refresh tokens are stored hashed (never raw) so a DB read can't leak a
// usable credential; lookups re-hash the incoming token and compare.
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Parses simple "<number><unit>" durations (s/m/h/d) — matches the format
// we control in .env, avoiding a dependency on jsonwebtoken's internal `ms`.
function parseDurationMs(duration) {
  const match = /^(\d+)(s|m|h|d)$/.exec(duration);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }
  const value = Number(match[1]);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  return value * unitMs;
}

function refreshExpiryDate() {
  return new Date(Date.now() + parseDurationMs(REFRESH_TTL));
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshExpiryDate,
  ACCESS_TTL,
  REFRESH_TTL,
};
