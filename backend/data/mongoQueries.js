/**
 * ========================================
 * MONGODB TESTING & QUERY EXAMPLES
 * ========================================
 *
 * This file contains MongoDB shell commands and queries
 * for testing and demonstrating MongoDB concepts.
 *
 * Can be executed in MongoDB shell or integrated into tests
 */

/**
 * ========================================
 * 1. BASIC QUERIES (Filter & Projection)
 * ========================================
 */

// Find all available porters
db.porters.find({ isAvailable: true });

// Find all porters in Central Station
db.porters.find({ station: "Central Station" });

// Find available porters in Central Station (uses compound index)
db.porters.find({
  station: "Central Station",
  isAvailable: true,
});

// Find porters with rating >= 4.5 (demonstrates $gte operator)
db.porters.find({
  rating: { $gte: 4.5 },
});

// Find porters with rating between 4.0 and 4.8 (demonstrates $gte and $lte)
db.porters.find({
  rating: {
    $gte: 4.0,
    $lte: 4.8,
  },
});

/**
 * ========================================
 * 2. ARRAY OPERATIONS
 * ========================================
 */

// Find all porters with "heavy luggage" skill
db.porters.find({
  skills: "heavy luggage",
});

// Find porters with either "heavy luggage" OR "VIP service" skill (demonstrates $in)
db.porters.find({
  skills: { $in: ["heavy luggage", "VIP service"] },
});

// Find porters with BOTH "heavy luggage" AND "express service" (demonstrates $all)
db.porters.find({
  skills: { $all: ["heavy luggage", "express service"] },
});

// Count porters with "VIP service" skill
db.porters.find({ skills: "VIP service" }).count();

/**
 * ========================================
 * 3. GEOSPATIAL QUERIES (CORE FEATURE)
 * ========================================
 *
 * These queries require 2dsphere index on location field
 */

// Find nearest porters to Central Station (within 5km)
// This is the MAIN UBER-STYLE query for finding nearby porters
db.porters
  .find({
    isAvailable: true,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [72.8247, 18.9676], // Central Station
        },
        $maxDistance: 5000, // 5km in meters
      },
    },
  })
  .limit(5) // Get top 5 nearest
  .pretty();

// Find porters within specific radius, sorted by distance
db.porters
  .find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [72.8247, 18.9676] },
        $maxDistance: 3000, // 3km
      },
    },
  })
  .limit(10);

// Find porters within a specific area (polygon) - Not used in our app but good to know
// This finds all porters within a defined geographical area
db.porters.find({
  location: {
    $geoWithin: {
      $geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.8, 18.96],
            [72.83, 18.96],
            [72.83, 18.97],
            [72.8, 18.97],
            [72.8, 18.96],
          ],
        ],
      },
    },
  },
});

/**
 * ========================================
 * 4. AGGREGATION PIPELINES
 * ========================================
 *
 * Advanced MongoDB feature for complex data transformations
 * Executed server-side for better performance
 */

// AGGREGATION 1: Best Porter Assignment Pipeline
// This is the CRITICAL query for Uber-style porter assignment
db.porters.aggregate([
  // STAGE 1: $geoNear - Find nearest porters
  {
    $geoNear: {
      near: { type: "Point", coordinates: [72.8247, 18.9676] },
      distanceField: "distance",
      maxDistance: 5000,
      spherical: true,
      query: {
        isAvailable: true,
        station: "Central Station",
      },
    },
  },

  // STAGE 2: $match - Filter by additional criteria
  {
    $match: {
      maxLoad: { $gte: 30 }, // Can carry at least 30kg
      rating: { $gte: 4.0 }, // Good rating
    },
  },

  // STAGE 3: $sort - Sort by rating (best first)
  {
    $sort: { rating: -1 },
  },

  // STAGE 4: $limit - Get only the top 1
  {
    $limit: 1,
  },

  // STAGE 5: $project - Select specific fields
  {
    $project: {
      _id: 1,
      name: 1,
      rating: 1,
      distance: 1,
      skills: 1,
      phone: 1,
      totalJobs: 1,
    },
  },
]);

// AGGREGATION 2: Analytics Pipeline
// Group porters by station and calculate statistics
db.porters.aggregate([
  // GROUP by station and calculate metrics
  {
    $group: {
      _id: "$station", // Group by station
      totalPorpers: { $sum: 1 }, // Count porters
      averageRating: { $avg: "$rating" }, // Average rating
      minRating: { $min: "$rating" }, // Minimum rating
      maxRating: { $max: "$rating" }, // Maximum rating
      availablePorpers: {
        $sum: { $cond: ["$isAvailable", 1, 0] }, // Count available
      },
      totalEarnings: { $sum: "$earnings" }, // Total earnings
      averageMaxLoad: { $avg: "$maxLoad" }, // Average capacity
    },
  },

  // SORT by station name
  {
    $sort: { _id: 1 },
  },

  // PROJECT to rename fields
  {
    $project: {
      station: "$_id",
      _id: 0,
      totalPorpers: 1,
      availablePorpers: 1,
      averageRating: { $round: ["$averageRating", 2] },
      minRating: 1,
      maxRating: 1,
      totalEarnings: 1,
      averageMaxLoad: { $round: ["$averageMaxLoad", 1] },
    },
  },
]);

// AGGREGATION 3: Skills Analysis Pipeline
// Find the most common skills among porters
db.porters.aggregate([
  // Unwind skills array to separate documents
  { $unwind: "$skills" },

  // Group by skill and count
  {
    $group: {
      _id: "$skills",
      porterCount: { $sum: 1 },
      averageRating: { $avg: "$rating" },
    },
  },

  // Sort by count (most common first)
  {
    $sort: { porterCount: -1 },
  },

  // Rename fields
  {
    $project: {
      skill: "$_id",
      _id: 0,
      porterCount: 1,
      averageRating: { $round: ["$averageRating", 2] },
    },
  },
]);

/**
 * ========================================
 * 5. BOOKING QUERIES
 * ========================================
 */

// Find all pending bookings
db.bookings.find({ status: "pending" });

// Find all bookings for a specific user
db.bookings.find({ userId: "user_001" });

// Find completed bookings at a specific station
db.bookings.find({
  station: "Central Station",
  status: "completed",
});

// Find bookings with luggage weight between 10kg and 50kg
db.bookings.find({
  totalWeight: {
    $gte: 10,
    $lte: 50,
  },
});

/**
 * ========================================
 * 6. AGGREGATION FOR BOOKINGS
 * ========================================
 */

// Pipeline: Get booking statistics by station
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
      averageFare: { $avg: "$estimatedFare" },
      averageRating: { $avg: "$rating" },
      totalWeight: { $sum: "$totalWeight" },
    },
  },
  { $sort: { totalBookings: -1 } },
  {
    $project: {
      station: "$_id",
      _id: 0,
      totalBookings: 1,
      completedBookings: 1,
      pendingBookings: 1,
      averageFare: { $round: ["$averageFare", 2] },
      averageRating: { $round: ["$averageRating", 2] },
      totalWeight: 1,
    },
  },
]);

/**
 * ========================================
 * 7. INDEX ANALYSIS
 * ========================================
 */

// Check all indexes on porters collection
db.porters.getIndexes();

// Check all indexes on bookings collection
db.bookings.getIndexes();

// Check index statistics and usage
db.porters.aggregate([{ $indexStats: {} }]);

/**
 * ========================================
 * 8. EXPLAIN QUERY EXECUTION
 * ========================================
 *
 * Shows how MongoDB executes a query
 * Helps understand if indexes are being used
 */

// Explain query execution - check if index is used
db.porters.find({ station: "Central Station" }).explain("executionStats");

// Explain geospatial query
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

/**
 * ========================================
 * 9. UPDATE OPERATIONS
 * ========================================
 */

// Add a skill to porter (demonstrates $addToSet - prevents duplicates)
db.porters.updateOne(
  { _id: ObjectId("...") },
  { $addToSet: { skills: "new skill" } },
);

// Remove a skill from porter (demonstrates $pull)
db.porters.updateOne(
  { _id: ObjectId("...") },
  { $pull: { skills: "old skill" } },
);

// Increment total jobs (demonstrates $inc)
db.porters.updateOne(
  { _id: ObjectId("...") },
  { $inc: { totalJobs: 1, earnings: 500 } },
);

// Update multiple porters status
db.bookings.updateMany(
  {
    status: "pending",
    createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  },
  { $set: { status: "cancelled" } },
);

/**
 * ========================================
 * 10. COMPLEX QUERIES ($OR, $AND)
 * ========================================
 */

// Find porters with "heavy luggage" OR "VIP service" AND available
db.porters.find({
  $and: [
    {
      $or: [{ skills: "heavy luggage" }, { skills: "VIP service" }],
    },
    { isAvailable: true },
  ],
});

// Find porters with rating > 4.5 OR maxLoad > 80
db.porters.find({
  $or: [{ rating: { $gt: 4.5 } }, { maxLoad: { $gt: 80 } }],
});

/**
 * ========================================
 * 11. PERFORMANCE TIPS
 * ========================================
 */

// Use .lean() in Mongoose for read-only queries (returns plain JS objects)
// db.collection.findOne().lean() // Faster than loading full documents

// Use projection to fetch only needed fields
db.porters.find(
  { isAvailable: true },
  { name: 1, rating: 1, phone: 1 }, // Only these fields
);

// Create compound index for combined queries
db.porters.createIndex({ station: 1, isAvailable: 1 });

// Check query performance
db.porters
  .find({ station: "Central Station" })
  .hint({ station: 1 })
  .explain("executionStats");
