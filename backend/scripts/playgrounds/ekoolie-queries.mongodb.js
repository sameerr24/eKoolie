use("ekoolie");
// Find all porters
db.porters.find();

// Find all available porters
db.porters.find({ isAvailable: true });

// Find porters in Central Station
db.porters.find({ station: "Central Station" });

// Find high-rated porters (>= 4.5)
db.porters.find({ rating: { $gte: 4.5 } });

// Find 5 nearest porters to Central Station location
db.porters
  .find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [72.8247, 18.9676], // Central Station
        },
        $maxDistance: 5000, // 5km
      },
    },
  })
  .limit(5);

// Find porters within 3km of a location
db.porters.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [72.8247, 18.9676],
      },
      $maxDistance: 3000, // 3km
    },
  },
});

// Find porters with "heavy luggage" skill
db.porters.find({ skills: "heavy luggage" });

// Find porters with EITHER "heavy luggage" OR "VIP service"
db.porters.find({
  skills: { $in: ["heavy luggage", "VIP service"] },
});

// Find porters with BOTH "heavy luggage" AND "express service"
db.porters.find({
  skills: { $all: ["heavy luggage", "express service"] },
});

// Find all pending bookings
db.bookings.find({ status: "pending" });

// Find all completed bookings
db.bookings.find({ status: "completed" });

// Find bookings at Central Station
db.bookings.find({ station: "Central Station" });

// Find bookings with luggage 10-50kg
db.bookings.find({
  totalWeight: {
    $gte: 10,
    $lte: 50,
  },
});

// Find bookings for specific user
db.bookings.find({ userId: "user_001" });

//AGGREGATION
// Porter Statistics by Station
db.porters.aggregate([
  {
    $group: {
      _id: "$station",
      totalPorers: { $sum: 1 },
      averageRating: { $avg: "$rating" },
      minRating: { $min: "$rating" },
      maxRating: { $max: "$rating" },
      totalEarnings: { $sum: "$earnings" },
    },
  },
  { $sort: { totalPorers: -1 } },
]);

// Booking Statistics by Station
db.bookings.aggregate([
  {
    $group: {
      _id: "$station",
      totalBookings: { $sum: 1 },
      completedBookings: {
        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
      },
      pendingBookings: {
        $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
      },
      avgFare: { $avg: "$estimatedFare" },
    },
  },
  { $sort: { totalBookings: -1 } },
]);

// Skills Analysis - Count porters by skill
db.porters.aggregate([
  { $unwind: "$skills" },
  {
    $group: {
      _id: "$skills",
      porterCount: { $sum: 1 },
      avgRating: { $avg: "$rating" },
    },
  },
  { $sort: { porterCount: -1 } },
]);


// Find best porter for booking near Central Station
// Considers: proximity, availability, capacity, rating
db.porters.aggregate([
  {
    $geoNear: {
      near: { type: "Point", coordinates: [72.8247, 18.9676] },
      distanceField: "distance",
      maxDistance: 5000,
      spherical: true,
      query: {
        isAvailable: true,
        station: "New Delhi Station",
      },
    },
  },
  {
    $match: {
      maxLoad: { $gte: 30 },
      rating: { $gte: 4.0 },
    },
  },
  { $sort: { rating: -1 } },
  { $limit: 1 },
  {
    $project: {
      name: 1,
      rating: 1,
      distance: 1,
      skills: 1,
      phone: 1,
      maxLoad: 1,
    },
  },
]);

// Add skill to porter (use $addToSet to avoid duplicates)
db.porters.updateOne(
  { name: "Rajesh Kumar" },
  { $addToSet: { skills: "new-skill" } }
);

// Remove skill from porter (use $pull)
db.porters.updateOne(
  { name: "Rajesh Kumar" },
  { $pull: { skills: "old-skill" } }
);

// Update porter availability
db.porters.updateOne(
  { name: "Rajesh Kumar" },
  { $set: { isAvailable: false } }
);

// Count total porters
db.porters.countDocuments();

// Count available porters
db.porters.countDocuments({ isAvailable: true });

// Count bookings by status
db.bookings.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 },
    },
  },
]);

// Top 5 highest-rated porters
db.porters.find().sort({ rating: -1 }).limit(5);

// Top 5 most experienced porters
db.porters.find().sort({ totalJobs: -1 }).limit(5);

// Find porters with high rating OR high capacity
db.porters.find({
  $or: [{ rating: { $gt: 4.5 } }, { maxLoad: { $gt: 80 } }],
});

// Find available porters with good rating AND high capacity
db.porters.find({
  $and: [
    { isAvailable: true },
    { rating: { $gte: 4.0 } },
    { maxLoad: { $gte: 70 } },
  ],
});

// Get all indexes on porters collection
db.porters.getIndexes();

// Get all indexes on bookings collection
db.bookings.getIndexes();

// Check if index is being used (look for executionStages)
db.porters.find({ station: "Central Station" }).explain("executionStats");

// Check geospatial query execution
db.porters
  .find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [72.8247, 18.9676] },
        $maxDistance: 5000,
      },
    },
  })
  .explain("executionStats");
