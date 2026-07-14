const bcrypt = require("bcryptjs");
const Booking = require("../models/Booking");
const Porter = require("../models/Porter");
const asyncHandler = require("../middleware/asyncHandler");

// POST /porters — register a new porter (hashes password before storing)
exports.addPorter = asyncHandler(async (req, res) => {
  const { name, phone, station, maxLoad, location, skills, username, password } =
    req.body;

  if (!location || location.type !== "Point" || !Array.isArray(location.coordinates)) {
    return res.status(400).json({
      error: 'Location must be GeoJSON Point: { type: "Point", coordinates: [longitude, latitude] }',
    });
  }

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const savedPorter = await new Porter({
    name,
    phone,
    station,
    maxLoad,
    location,
    skills: skills || [],
    username,
    passwordHash,
  }).save();

  res.status(201).json({ message: "Porter added successfully", data: savedPorter });
});

// GET /porters?station=&isAvailable=&minRating= — list porters with optional filters
exports.getAllPorters = asyncHandler(async (req, res) => {
  const { station, isAvailable, minRating } = req.query;

  const filter = {};
  if (station) filter.station = station; // uses single-field index
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === "true"; // uses compound index with station
  if (minRating) filter.rating = { $gte: parseFloat(minRating) };

  const porters = await Porter.find(filter).lean(); // .lean(): plain objects, faster for read-only queries

  res.json({ count: porters.length, data: porters });
});

// GET /porters/:id
exports.getPorterById = asyncHandler(async (req, res) => {
  const porter = await Porter.findById(req.params.id);
  if (!porter) {
    return res.status(404).json({ error: "Porter not found" });
  }
  res.json({ data: porter });
});

// POST /porters/:id/skills — $addToSet keeps the skills array free of duplicates
exports.addSkill = asyncHandler(async (req, res) => {
  const { skill } = req.body;
  if (!skill) {
    return res.status(400).json({ error: "Skill is required" });
  }

  const updatedPorter = await Porter.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { skills: skill } },
    { new: true, runValidators: true },
  );

  if (!updatedPorter) {
    return res.status(404).json({ error: "Porter not found" });
  }

  res.json({ message: "Skill added successfully", data: updatedPorter });
});

// DELETE /porters/:id/skills — $pull removes matching array elements
exports.removeSkill = asyncHandler(async (req, res) => {
  const { skill } = req.body;

  const updatedPorter = await Porter.findByIdAndUpdate(
    req.params.id,
    { $pull: { skills: skill } },
    { new: true },
  );

  if (!updatedPorter) {
    return res.status(404).json({ error: "Porter not found" });
  }

  res.json({ message: "Skill removed successfully", data: updatedPorter });
});

// PATCH /porters/:id/availability
exports.updateAvailability = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;

  const updatedPorter = await Porter.findByIdAndUpdate(
    req.params.id,
    { isAvailable },
    { new: true },
  );

  if (!updatedPorter) {
    return res.status(404).json({ error: "Porter not found" });
  }

  res.json({ message: "Availability updated", data: updatedPorter });
});

// GET /porters/filter/by-skill?skills=a,b — $in matches porters with ANY of the given skills
exports.getPortersBySkill = asyncHandler(async (req, res) => {
  const { skills } = req.query;
  if (!skills) {
    return res.status(400).json({ error: "Skills parameter required (comma-separated)" });
  }

  const skillArray = skills.split(",").map((s) => s.trim());

  const porters = await Porter.find({
    skills: { $in: skillArray },
    isAvailable: true,
  }).lean();

  res.json({ skills: skillArray, count: porters.length, data: porters });
});

// PATCH /porters/:id/stats — $inc increments totalJobs/earnings atomically
exports.updatePorterStats = asyncHandler(async (req, res) => {
  const { rating, earnings } = req.body;

  const updateObj = { $inc: { totalJobs: 1 } };
  if (rating !== undefined) updateObj.rating = rating;
  if (earnings !== undefined) updateObj.$inc.earnings = earnings;

  const updatedPorter = await Porter.findByIdAndUpdate(req.params.id, updateObj, { new: true });

  if (!updatedPorter) {
    return res.status(404).json({ error: "Porter not found" });
  }

  res.json({ message: "Porter stats updated", data: updatedPorter });
});

// POST /porters/login
exports.loginPorter = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const porter = await Porter.findOne({ username: username.trim().toLowerCase() }).select(
    "+passwordHash",
  );
  if (!porter) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, porter.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({
    message: "Login successful",
    data: {
      id: porter._id,
      name: porter.name,
      username: porter.username,
      phone: porter.phone,
      station: porter.station,
      rating: porter.rating,
      skills: porter.skills,
      earnings: porter.earnings,
      completedBookings: porter.completedBookings,
      totalJobs: porter.totalJobs,
      isAvailable: porter.isAvailable,
    },
  });
});

// GET /porters/:id/bookings?status=
exports.getPorterBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { assignedPorter: req.params.id };
  if (status) filter.status = status;

  const bookings = await Booking.find(filter).sort({ createdAt: -1 }).lean();

  res.json({ count: bookings.length, data: bookings });
});

// POST /porters/:id/bookings/:bookingId/accept
exports.acceptBooking = asyncHandler(async (req, res) => {
  const { id, bookingId } = req.params;

  const booking = await Booking.findOne({ _id: bookingId, assignedPorter: id });
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.status !== "requested") {
    return res.status(400).json({ error: "Booking must be in requested status" });
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    { status: "assigned" },
    { new: true },
  );
  await Porter.findByIdAndUpdate(id, { isAvailable: false });

  res.json({ message: "Booking accepted", data: updatedBooking });
});

// POST /porters/:id/bookings/:bookingId/decline
exports.declineBooking = asyncHandler(async (req, res) => {
  const { id, bookingId } = req.params;

  const booking = await Booking.findOne({ _id: bookingId, assignedPorter: id });
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.status !== "requested") {
    return res.status(400).json({ error: "Booking must be in requested status" });
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    { status: "cancelled" },
    { new: true },
  );

  res.json({ message: "Booking declined", data: updatedBooking });
});

// POST /porters/:id/bookings/:bookingId/complete — requires payment to be settled first
exports.completeBooking = asyncHandler(async (req, res) => {
  const { id, bookingId } = req.params;

  const booking = await Booking.findOne({ _id: bookingId, assignedPorter: id });
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.paymentStatus !== "paid") {
    return res.status(400).json({
      error: "Payment must be completed before marking the booking completed",
    });
  }
  if (!["assigned", "in_progress"].includes(booking.status)) {
    return res.status(400).json({ error: "Booking must be assigned or in progress" });
  }

  const fare = Number(booking.estimatedFare || 0);

  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    { status: "completed", actualFare: fare },
    { new: true },
  );

  await Porter.findByIdAndUpdate(id, {
    $inc: { earnings: fare, completedBookings: 1, totalJobs: 1 },
    isAvailable: true,
  });

  res.json({ message: "Booking completed", data: updatedBooking });
});
