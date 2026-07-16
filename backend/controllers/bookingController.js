const Booking = require("../models/Booking");
const Porter = require("../models/Porter");
const asyncHandler = require("../middleware/asyncHandler");

function validateGeoPoint(location) {
  return location && location.type === "Point" && Array.isArray(location.coordinates);
}

function calculateTotals(items) {
  const totalWeight = Array.isArray(items) ? items.reduce((sum, item) => sum + item.weight, 0) : 0;
  const estimatedFare = 50 + totalWeight * 10; // flat ₹50 base + ₹10/kg
  return { totalWeight, estimatedFare };
}

// POST /bookings — creates an unassigned booking; call assign-best-porter or
// /bookings/request separately to attach a porter.
exports.createBooking = asyncHandler(async (req, res) => {
  const { userPhone, station, location, items, specialRequests } = req.body;
  const userId = req.user.id; // from the traveller's access token, not client input

  if (!validateGeoPoint(location)) {
    return res.status(400).json({
      error: 'Location must be GeoJSON Point: { type: "Point", coordinates: [longitude, latitude] }',
    });
  }

  const { totalWeight, estimatedFare } = calculateTotals(items);

  const savedBooking = await new Booking({
    userId,
    userPhone,
    station,
    location,
    items: items || [],
    totalWeight,
    estimatedFare,
    specialRequests: specialRequests || "",
    status: "pending",
    paymentStatus: "unpaid",
  }).save();

  res.status(201).json({
    message: "Booking created successfully. Use /assign-porter to assign a porter.",
    data: savedBooking,
  });
});

// POST /bookings/request — creates a booking tied to a specific porter; the
// porter must accept it before it moves past "requested".
exports.createBookingRequest = asyncHandler(async (req, res) => {
  const { userPhone, station, location, items, specialRequests, assignedPorter } = req.body;
  const userId = req.user.id; // from the traveller's access token, not client input

  if (!assignedPorter) {
    return res.status(400).json({ error: "assignedPorter is required" });
  }
  if (!validateGeoPoint(location)) {
    return res.status(400).json({
      error: 'Location must be GeoJSON Point: { type: "Point", coordinates: [longitude, latitude] }',
    });
  }

  const porter = await Porter.findById(assignedPorter).lean();
  if (!porter) {
    return res.status(404).json({ error: "Assigned porter not found" });
  }

  const { totalWeight, estimatedFare } = calculateTotals(items);

  const savedBooking = await new Booking({
    userId,
    userPhone,
    station,
    location,
    items: items || [],
    totalWeight,
    estimatedFare,
    specialRequests: specialRequests || "",
    status: "requested",
    paymentStatus: "unpaid",
    assignedPorter,
  }).save();

  res.status(201).json({ message: "Booking request created successfully", data: savedBooking });
});

// GET /bookings?station=&status=&userId=&minWeight=&maxWeight=&assignedPorter=
exports.getAllBookings = asyncHandler(async (req, res) => {
  const { station, status, userId, minWeight, maxWeight, assignedPorter } = req.query;

  const filter = {};
  if (station) filter.station = station;
  if (status) filter.status = status;
  if (userId) filter.userId = userId;
  if (assignedPorter) filter.assignedPorter = assignedPorter;
  if (minWeight || maxWeight) {
    filter.totalWeight = {};
    if (minWeight) filter.totalWeight.$gte = parseFloat(minWeight);
    if (maxWeight) filter.totalWeight.$lte = parseFloat(maxWeight);
  }

  const bookings = await Booking.find(filter)
    .populate("assignedPorter", "name phone rating station") // join in porter fields without a separate query
    .lean();

  res.json({ count: bookings.length, data: bookings });
});

// GET /bookings/:id
exports.getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("assignedPorter");
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  res.json({ data: booking });
});

// GET /bookings/nearest-porters?longitude=&latitude=&maxDistance=&station=&minCapacity=&skill=&limit=
// Core geospatial feature: $near requires the 2dsphere index on Porter.location.
exports.findNearestPorters = asyncHandler(async (req, res) => {
  const {
    longitude,
    latitude,
    maxDistance = 5000, // metres
    station,
    minCapacity,
    skill,
    limit = 5,
  } = req.query;

  if (!longitude || !latitude) {
    return res.status(400).json({ error: "longitude and latitude parameters required" });
  }

  const filterQuery = {
    isAvailable: true,
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
        $maxDistance: parseInt(maxDistance),
      },
    },
  };

  if (station) filterQuery.station = station;
  if (minCapacity) filterQuery.maxLoad = { $gte: parseFloat(minCapacity) };
  if (skill) filterQuery.skills = skill;

  const porters = await Porter.find(filterQuery).limit(parseInt(limit)).lean();

  res.json({ location: { longitude, latitude }, maxDistance, count: porters.length, data: porters });
});

// POST /bookings/:bookingId/assign-best-porter
// Aggregation pipeline: $geoNear (nearest + distance) -> $match (capacity/rating) -> $sort -> $limit 1.
exports.assignBestPorter = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.status !== "pending") {
    return res.status(400).json({ error: "Booking must be in pending status" });
  }

  const pipeline = [
    {
      $geoNear: {
        key: "location",
        near: booking.location,
        distanceField: "distance",
        maxDistance: 5000,
        spherical: true,
        query: { isAvailable: true, station: booking.station },
      },
    },
    { $match: { maxLoad: { $gte: booking.totalWeight }, rating: { $gte: 4.0 } } },
    { $sort: { rating: -1 } },
    { $limit: 1 },
    { $project: { _id: 1, name: 1, rating: 1, totalJobs: 1, distance: 1, skills: 1, phone: 1 } },
  ];

  const bestPorters = await Porter.aggregate(pipeline);
  if (bestPorters.length === 0) {
    return res.status(404).json({
      error: "No suitable porters found nearby",
      suggestion: "Try increasing maxDistance or lowering minimum rating requirements",
    });
  }

  const bestPorter = bestPorters[0];

  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    { assignedPorter: bestPorter._id, status: "assigned", paymentStatus: "pending" },
    { new: true },
  ).populate("assignedPorter");

  res.json({
    message: "Best porter assigned successfully",
    assignment: {
      porterName: bestPorter.name,
      porterRating: bestPorter.rating,
      distance: `${(bestPorter.distance / 1000).toFixed(2)} km`,
      porterPhone: bestPorter.phone,
    },
    booking: updatedBooking,
  });
});

// POST /bookings/:bookingId/items — $push appends to the items array, then
// totalWeight/estimatedFare are recalculated from the full array.
exports.addItemToBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { name, weight, description } = req.body;

  if (!name || weight === undefined) {
    return res.status(400).json({ error: "name and weight are required" });
  }

  let booking = await Booking.findByIdAndUpdate(
    bookingId,
    { $push: { items: { name, weight: parseFloat(weight), description: description || "" } } },
    { new: true },
  );

  const { totalWeight, estimatedFare } = calculateTotals(booking.items);
  booking = await Booking.findByIdAndUpdate(
    bookingId,
    { totalWeight, estimatedFare },
    { new: true },
  );

  res.json({ message: "Item added to booking", data: booking });
});

// PATCH /bookings/:bookingId/status
exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;

  const validStatuses = ["requested", "pending", "assigned", "in_progress", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
  }

  const updatedBooking = await Booking.findByIdAndUpdate(bookingId, { status }, { new: true }).populate(
    "assignedPorter",
  );
  if (!updatedBooking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  res.json({ message: "Booking status updated", data: updatedBooking });
});

// POST /bookings/:bookingId/payment
exports.markBookingAsPaid = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.userId !== req.user.id) {
    return res.status(403).json({ error: "This booking does not belong to you" });
  }
  if (booking.paymentStatus === "paid") {
    return res.json({ message: "Booking already paid", data: booking });
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    { paymentStatus: "paid" },
    { new: true },
  ).populate("assignedPorter");

  res.json({ message: "Payment recorded successfully", data: updatedBooking });
});

// GET /bookings/:bookingId/location — traveller polls this for their porter's live position
exports.getBookingLocation = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId).select("userId currentLocation locationUpdatedAt");
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.userId !== req.user.id) {
    return res.status(403).json({ error: "This booking does not belong to you" });
  }

  // An empty array is truthy in JS, and Mongoose materializes the
  // sub-document shell even when unset — so check length, not just presence.
  const coords = booking.currentLocation?.coordinates;
  const hasCoordinates = Array.isArray(coords) && coords.length === 2;

  res.json({
    data: {
      coordinates: hasCoordinates ? coords : null,
      updatedAt: booking.locationUpdatedAt,
    },
  });
});
