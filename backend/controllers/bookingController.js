/**
 * BOOKING CONTROLLER
 *
 * Handles booking operations with advanced MongoDB features:
 * - Geospatial queries ($near, $geoWithin)
 * - Aggregation pipelines ($geoNear, $match, $sort, $limit)
 * - Array operations ($push for items)
 * - References and population
 * - Complex filtering with operators ($gte, $lte, $or, $and)
 */

const Booking = require("../models/Booking");
const Porter = require("../models/Porter");

/**
 * ========================================
 * 1. CREATE BOOKING
 * ========================================
 *
 * Creates a new booking request
 * Does NOT automatically assign a porter (see assignPorter endpoint)
 */
exports.createBooking = async (req, res) => {
  try {
    const { userId, userPhone, station, location, items, specialRequests } =
      req.body;

    // Validate GeoJSON Point
    if (
      !location ||
      location.type !== "Point" ||
      !Array.isArray(location.coordinates)
    ) {
      return res.status(400).json({
        error:
          'Location must be GeoJSON Point: { type: "Point", coordinates: [longitude, latitude] }',
      });
    }

    // Calculate total weight from items
    let totalWeight = 0;
    if (items && Array.isArray(items)) {
      totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    }

    // Calculate estimated fare (simplified: ₹50 base + ₹10 per kg)
    const estimatedFare = 50 + totalWeight * 10;

    const newBooking = new Booking({
      userId,
      userPhone,
      station,
      location,
      items: items || [],
      totalWeight,
      estimatedFare,
      specialRequests: specialRequests || "",
      status: "pending",
    });

    const savedBooking = await newBooking.save();

    res.status(201).json({
      message:
        "Booking created successfully. Use /assign-porter to assign a porter.",
      data: savedBooking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 1B. CREATE BOOKING REQUEST (ASSIGNED PORTER)
 * ========================================
 *
 * Creates a booking request tied to a specific porter.
 * Status starts as 'requested' and must be accepted by the porter.
 */
exports.createBookingRequest = async (req, res) => {
  try {
    const {
      userId,
      userPhone,
      station,
      location,
      items,
      specialRequests,
      assignedPorter,
    } = req.body;

    if (!assignedPorter) {
      return res.status(400).json({ error: "assignedPorter is required" });
    }

    // Validate GeoJSON Point
    if (
      !location ||
      location.type !== "Point" ||
      !Array.isArray(location.coordinates)
    ) {
      return res.status(400).json({
        error:
          'Location must be GeoJSON Point: { type: "Point", coordinates: [longitude, latitude] }',
      });
    }

    const porter = await Porter.findById(assignedPorter).lean();
    if (!porter) {
      return res.status(404).json({ error: "Assigned porter not found" });
    }

    // Calculate total weight from items
    let totalWeight = 0;
    if (items && Array.isArray(items)) {
      totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    }

    // Calculate estimated fare (simplified: ₹50 base + ₹10 per kg)
    const estimatedFare = 50 + totalWeight * 10;

    const newBooking = new Booking({
      userId,
      userPhone,
      station,
      location,
      items: items || [],
      totalWeight,
      estimatedFare,
      specialRequests: specialRequests || "",
      status: "requested",
      assignedPorter,
    });

    const savedBooking = await newBooking.save();

    res.status(201).json({
      message: "Booking request created successfully",
      data: savedBooking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 2. GET ALL BOOKINGS WITH FILTERING
 * ========================================
 *
 * Demonstrates:
 * - Complex filtering ($or, $and)
 * - Comparison operators ($gte, $lte)
 * - Populate to include referenced Porter data
 */
exports.getAllBookings = async (req, res) => {
  try {
    const { station, status, userId, minWeight, maxWeight, assignedPorter } =
      req.query;

    let filter = {};

    if (station) filter.station = station;
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (assignedPorter) filter.assignedPorter = assignedPorter;

    /**
     * Range filtering using $gte and $lte operators
     *
     * Example query: GET /bookings?minWeight=5&maxWeight=50
     *
     * MongoDB Shell equivalent:
     * db.bookings.find({
     *   totalWeight: { $gte: 5, $lte: 50 }
     * })
     */
    if (minWeight || maxWeight) {
      filter.totalWeight = {};
      if (minWeight) filter.totalWeight.$gte = parseFloat(minWeight);
      if (maxWeight) filter.totalWeight.$lte = parseFloat(maxWeight);
    }

    /**
     * Using .populate() to fetch referenced Porter data
     *
     * Without populate: assignedPorter is just an ObjectId
     * With populate: assignedPorter contains full Porter document
     *
     * Equivalent to SQL JOIN operation
     */
    const bookings = await Booking.find(filter)
      .populate("assignedPorter", "name phone rating station") // Fetch specific fields
      .lean();

    res.json({
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 3. GET BOOKING BY ID
 * ========================================
 */
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "assignedPorter",
    );

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ data: booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 4. FIND NEAREST AVAILABLE PORTERS (Geospatial Query)
 * ========================================
 *
 * CORE MONGODB GEOSPATIAL FEATURE
 *
 * Demonstrates:
 * - $near operator for proximity search
 * - $geometry for GeoJSON Point specification
 * - $maxDistance in meters
 * - 2dsphere index requirement
 *
 * Use Case: Find 5 nearest porters to user's location who:
 * - Are available
 * - Have maxLoad >= booking's totalWeight
 * - Work in the same station
 * - Have the required skill (if specified)
 */
exports.findNearestPorters = async (req, res) => {
  try {
    const {
      longitude,
      latitude,
      maxDistance = 5000, // default 5km
      station,
      minCapacity,
      skill,
      limit = 5,
    } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        error: "longitude and latitude parameters required",
      });
    }

    // Build the query filter
    let filterQuery = {
      isAvailable: true,
      location: {
        /**
         * GEOSPATIAL QUERY: $near
         *
         * Syntax:
         * location: {
         *   $near: {
         *     $geometry: { type: 'Point', coordinates: [lng, lat] },
         *     $maxDistance: distance_in_meters
         *   }
         * }
         *
         * IMPORTANT:
         * - Requires 2dsphere index on location field
         * - Returns results sorted by distance (closest first)
         * - $maxDistance is in METERS (not degrees)
         * - Coordinates must be [longitude, latitude]
         *
         * MongoDB Shell Example:
         * db.porters.find({
         *   isAvailable: true,
         *   location: {
         *     $near: {
         *       $geometry: { type: 'Point', coordinates: [72.8247, 18.9676] },
         *       $maxDistance: 5000
         *     }
         *   }
         * }).limit(5)
         */
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    };

    // Add station filter if provided
    if (station) {
      filterQuery.station = station;
    }

    // Add capacity filter if provided
    if (minCapacity) {
      filterQuery.maxLoad = { $gte: parseFloat(minCapacity) };
    }

    // Add skill filter if provided
    if (skill) {
      filterQuery.skills = skill;
    }

    /**
     * Execute the geospatial query
     * Results are automatically sorted by distance
     */
    const porters = await Porter.find(filterQuery)
      .limit(parseInt(limit))
      .lean();

    res.json({
      location: { longitude, latitude },
      maxDistance,
      count: porters.length,
      data: porters,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 5. ASSIGN BEST PORTER USING AGGREGATION PIPELINE
 * ========================================
 *
 * ADVANCED MONGODB FEATURE: Aggregation Pipeline
 *
 * This is the CORE showcase of MongoDB capabilities:
 * - $geoNear: Geospatial lookup with distance calculation
 * - $match: Filter documents
 * - $sort: Sort results
 * - $limit: Limit output
 *
 * Aggregation pipelines execute on MongoDB server:
 * - More efficient than JavaScript filtering
 * - Can process large datasets
 * - Allows complex multi-stage transformations
 */
exports.assignBestPorter = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Get the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Booking must be in pending status" });
    }

    /**
     * ========================================
     * AGGREGATION PIPELINE: BEST PORTER ASSIGNMENT
     * ========================================
     *
     * Stages:
     * 1. $geoNear: Find porters near booking location + calculate distance
     * 2. $match: Filter by availability, capacity, station, skills
     * 3. $addFields: Add calculated fields (distance already added by $geoNear)
     * 4. $sort: Sort by rating (best first)
     * 5. $limit: Get only top result
     *
     * This is more efficient than:
     * - Multiple queries
     * - Post-processing in JavaScript
     * - Building complex indexes
     */
    const pipeline = [
      /**
       * STAGE 1: $geoNear
       *
       * Finds porters near the booking location
       * IMPORTANT: Must be the FIRST stage in pipeline
       *
       * Parameters:
       * - near: GeoJSON Point of booking location
       * - distanceField: Field name to store calculated distance
       * - maxDistance: Maximum distance in meters (5km)
       * - spherical: Use spherical geometry (true for lat/lng)
       * - query: Additional filter conditions
       *
       * Output adds "distance" field to each document
       * Results sorted by distance automatically
       */
      {
        $geoNear: {
          key: "location",
          near: booking.location,
          distanceField: "distance",
          maxDistance: 5000, // 5km in meters
          spherical: true,
          // Pre-filter before calculating distance for performance
          query: {
            isAvailable: true,
            station: booking.station,
          },
        },
      },

      /**
       * STAGE 2: $match
       *
       * Additional filtering after $geoNear
       *
       * Filters:
       * - maxLoad >= totalWeight (porter can carry luggage)
       * - rating >= 4.0 (good quality)
       * - Optional: specific skill if required
       */
      {
        $match: {
          maxLoad: { $gte: booking.totalWeight },
          rating: { $gte: 4.0 },
        },
      },

      /**
       * STAGE 3: $sort
       *
       * Sort by rating (descending) to get best porter
       * -1 = descending (highest first)
       * 1 = ascending (lowest first)
       */
      {
        $sort: { rating: -1 },
      },

      /**
       * STAGE 4: $limit
       *
       * Return only 1 result (the best porter)
       */
      {
        $limit: 1,
      },

      /**
       * STAGE 5: $project (optional)
       *
       * Select specific fields to return
       * Reduces data transfer
       */
      {
        $project: {
          _id: 1,
          name: 1,
          rating: 1,
          totalJobs: 1,
          distance: 1,
          skills: 1,
          phone: 1,
        },
      },
    ];

    /**
     * Execute aggregation pipeline
     * Returns array of results
     */
    const bestPorters = await Porter.aggregate(pipeline);

    if (bestPorters.length === 0) {
      return res.status(404).json({
        error: "No suitable porters found nearby",
        suggestion:
          "Try increasing maxDistance or lowering minimum rating requirements",
      });
    }

    const bestPorter = bestPorters[0];

    /**
     * Update booking with assigned porter
     * Change status to 'assigned'
     */
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        assignedPorter: bestPorter._id,
        status: "assigned",
      },
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 6. ADD ITEM TO BOOKING (Array Operations)
 * ========================================
 *
 * Demonstrates:
 * - $push operator to add to array
 * - Recalculating totalWeight after array modification
 */
exports.addItemToBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { name, weight, description } = req.body;

    if (!name || weight === undefined) {
      return res.status(400).json({
        error: "name and weight are required",
      });
    }

    /**
     * Using $push to add item to items array
     *
     * Syntax: { $push: { arrayField: value } }
     *
     * MongoDB Shell:
     * db.bookings.updateOne(
     *   { _id: ObjectId("...") },
     *   {
     *     $push: { items: { name: "Suitcase", weight: 25 } }
     *   }
     * )
     */
    let booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $push: {
          items: {
            name,
            weight: parseFloat(weight),
            description: description || "",
          },
        },
      },
      { new: true },
    );

    // Recalculate total weight
    const totalWeight = booking.items.reduce(
      (sum, item) => sum + item.weight,
      0,
    );
    const newFare = 50 + totalWeight * 10;

    booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        totalWeight,
        estimatedFare: newFare,
      },
      { new: true },
    );

    res.json({
      message: "Item added to booking",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 7. UPDATE BOOKING STATUS
 * ========================================
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "requested",
      "pending",
      "assigned",
      "in_progress",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true },
    ).populate("assignedPorter");

    if (!updatedBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({
      message: "Booking status updated",
      data: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
