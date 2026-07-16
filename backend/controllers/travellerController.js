const bcrypt = require("bcryptjs");
const Traveller = require("../models/Traveller");
const asyncHandler = require("../middleware/asyncHandler");
const { issueTokenPair } = require("../services/tokenService");

// POST /travellers/register
exports.register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: "name, username, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const existing = await Traveller.findOne({ username: username.trim().toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: "Username is already taken" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const traveller = await new Traveller({
    name,
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    passwordHash,
  }).save();

  const accessToken = await issueTokenPair(res, { id: traveller._id.toString(), role: "traveller" });

  res.status(201).json({
    message: "Registration successful",
    accessToken,
    data: { id: traveller._id, name: traveller.name, username: traveller.username, email: traveller.email },
  });
});

// POST /travellers/login
exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const traveller = await Traveller.findOne({ username: username.trim().toLowerCase() }).select(
    "+passwordHash",
  );
  if (!traveller) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, traveller.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = await issueTokenPair(res, { id: traveller._id.toString(), role: "traveller" });

  res.json({
    message: "Login successful",
    accessToken,
    data: { id: traveller._id, name: traveller.name, username: traveller.username, email: traveller.email },
  });
});
