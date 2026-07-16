const RefreshToken = require("../models/RefreshToken");
const asyncHandler = require("../middleware/asyncHandler");
const { verifyRefreshToken, hashToken } = require("../utils/tokens");
const { REFRESH_COOKIE_NAME, clearRefreshCookie } = require("../utils/cookies");
const { issueTokenPair } = require("../services/tokenService");

// POST /auth/refresh
// Rotates the refresh token: the one presented is revoked and a new pair is
// issued, so a stolen refresh token can only be replayed once before the
// legitimate owner's next refresh invalidates it.
exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }

  const tokenHash = hashToken(token);
  const stored = await RefreshToken.findOne({ tokenHash });
  if (!stored) {
    clearRefreshCookie(res);
    return res.status(401).json({ error: "Refresh token has been revoked" });
  }

  await RefreshToken.deleteOne({ _id: stored._id });

  const accessToken = await issueTokenPair(res, { id: payload.id, role: payload.role });
  res.json({ accessToken });
});

// POST /auth/logout
exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) {
    await RefreshToken.deleteOne({ tokenHash: hashToken(token) });
  }
  clearRefreshCookie(res);
  res.json({ message: "Logged out" });
});
