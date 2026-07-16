const RefreshToken = require("../models/RefreshToken");
const { signAccessToken, signRefreshToken, hashToken, refreshExpiryDate } = require("../utils/tokens");
const { setRefreshCookie } = require("../utils/cookies");

// Issues an access token, mints + stores a hashed refresh token, and sets the
// refresh cookie on the response. Shared by traveller and porter auth flows.
async function issueTokenPair(res, { id, role }) {
  const accessToken = signAccessToken({ id, role });
  const refreshToken = signRefreshToken({ id, role });

  await RefreshToken.create({
    tokenHash: hashToken(refreshToken),
    subjectId: id,
    role,
    expiresAt: refreshExpiryDate(),
  });

  setRefreshCookie(res, refreshToken);
  return accessToken;
}

module.exports = { issueTokenPair };
