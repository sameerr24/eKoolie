/**
 * PORTER CONTROLLER
 *
 * Handles all porter-related operations
 * Demonstrates MongoDB concepts:
 * - Array operations ($push, $addToSet, $pull)
 * - Update operators
 * - Aggregation pipelines
 * - Indexing benefits
 */

const bcrypt = require("bcryptjs");
const Booking = require("../models/Booking");
const Porter = require("../models/Porter");

/**
 * ========================================
 * 1. ADD NEW PORTER
 * ========================================
 *
 * Simple insertion demonstrating schema validation
 */
exports.addPorter = async (req, res) => {
  try {
    const {
      name,
      phone,
      station,
      maxLoad,
      location,
      skills,
      username,
      password,
    } = req.body;

    // Validate GeoJSON Point format
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

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "username and password are required" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newPorter = new Porter({
      name,
      phone,
      station,
      maxLoad,
      location,
      skills: skills || [],
      username,
      passwordHash,
    });

    const savedPorter = await newPorter.save();

    res.status(201).json({
      message: "Porter added successfully",
      data: savedPorter,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * ========================================
 * 2. GET ALL PORTERS WITH FILTERING
 * ========================================
 *
 * Demonstrates:
 * - Filtering with multiple conditions
 * - Index usage (station, isAvailable)
 * - Lean queries for performance (returns plain objects, not Mongoose documents)
 */
exports.getAllPorters = async (req, res) => {
  try {
    const { station, isAvailable, minRating } = req.query;

    // Build filter object
    let filter = {};

    // Filter by station (uses single field index)
    if (station) {
      filter.station = station;
    }

    // Filter by availability (uses compound index with station)
    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === "true";
    }

    // Filter by minimum rating (demonstrates $gte operator)
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }

    /**
     * Using .lean() for better performance:
     * - Returns plain JavaScript objects instead of Mongoose documents
     * - Significantly faster for large datasets
     * - Perfect for read-only operations
     *
     * Without .lean():
     * const porters = await Porter.find(filter);
     */
    const porters = await Porter.find(filter).lean();

    res.json({
      count: porters.length,
      data: porters,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 3. GET PORTER BY ID
 * ========================================
 */
exports.getPorterById = async (req, res) => {
  try {
    const porter = await Porter.findById(req.params.id);

    if (!porter) {
      return res.status(404).json({ error: "Porter not found" });
    }

    res.json({ data: porter });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 4. ADD SKILL TO PORTER (Array Operations)
 * ========================================
 *
 * Demonstrates MongoDB array operators:
 *
 * A) $addToSet: Adds element only if it doesn't exist (maintains uniqueness)
 *    - Returns error if duplicate
 *    - Best for unique values
 *
 * B) $push: Always adds element (allows duplicates)
 *    - Always succeeds
 *    - Can be used with $each for bulk additions
 *
 * This endpoint uses $addToSet to prevent duplicate skills
 */
exports.addSkill = async (req, res) => {
  try {
    const { skill } = req.body;

    if (!skill) {
      return res.status(400).json({ error: "Skill is required" });
    }

    /**
     * Update using $addToSet operator
     *
     * Syntax: { $addToSet: { arrayField: value } }
     *
     * Example in MongoDB Shell:
     * db.porters.updateOne(
     *   { _id: ObjectId("...") },
     *   { $addToSet: { skills: "heavy luggage" } }
     * )
     */
    const updatedPorter = await Porter.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { skills: skill } }, // $addToSet prevents duplicates
      { new: true, runValidators: true }, // Return updated document
    );

    if (!updatedPorter) {
      return res.status(404).json({ error: "Porter not found" });
    }

    res.json({
      message: "Skill added successfully",
      data: updatedPorter,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 5. REMOVE SKILL FROM PORTER
 * ========================================
 *
 * Demonstrates $pull operator:
 * - Removes matching elements from array
 * - Can use conditions to match elements
 */
exports.removeSkill = async (req, res) => {
  try {
    const { skill } = req.body;

    /**
     * Update using $pull operator
     *
     * Syntax: { $pull: { arrayField: value } }
     *
     * Example in MongoDB Shell:
     * db.porters.updateOne(
     *   { _id: ObjectId("...") },
     *   { $pull: { skills: "heavy luggage" } }
     * )
     */
    const updatedPorter = await Porter.findByIdAndUpdate(
      req.params.id,
      { $pull: { skills: skill } }, // $pull removes matching elements
      { new: true },
    );

    if (!updatedPorter) {
      return res.status(404).json({ error: "Porter not found" });
    }

    res.json({
      message: "Skill removed successfully",
      data: updatedPorter,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 6. UPDATE PORTER AVAILABILITY
 * ========================================
 */
exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const updatedPorter = await Porter.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true },
    );

    if (!updatedPorter) {
      return res.status(404).json({ error: "Porter not found" });
    }

    res.json({
      message: "Availability updated",
      data: updatedPorter,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 7. GET PORTER BY SKILL
 * ========================================
 *
 * Demonstrates:
 * - Querying array elements
 * - Using 'in' operator ($in) for multiple values
 */
exports.getPortersBySkill = async (req, res) => {
  try {
    const { skills } = req.query;

    if (!skills) {
      return res
        .status(400)
        .json({ error: "Skills parameter required (comma-separated)" });
    }

    const skillArray = skills.split(",").map((s) => s.trim());

    /**
     * Query array elements using $in operator
     *
     * Finds porters that have ANY of the specified skills
     *
     * MongoDB Shell equivalent:
     * db.porters.find({
     *   skills: { $in: ["heavy luggage", "VIP service"] }
     * })
     */
    const porters = await Porter.find({
      skills: { $in: skillArray },
      isAvailable: true,
    }).lean();

    res.json({
      skills: skillArray,
      count: porters.length,
      data: porters,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 8. UPDATE PORTER RATING AND JOBS
 * ========================================
 *
 * Demonstrates:
 * - $inc operator: increment numeric field
 */
exports.updatePorterStats = async (req, res) => {
  try {
    const { rating, earnings } = req.body;

    // Build update object dynamically
    let updateObj = {};

    // Increment totalJobs by 1
    updateObj.$inc = { totalJobs: 1 };

    // Update or set rating
    if (rating !== undefined) {
      updateObj.rating = rating;
    }

    // Increment earnings
    if (earnings !== undefined) {
      updateObj.$inc.earnings = earnings;
    }

    const updatedPorter = await Porter.findByIdAndUpdate(
      req.params.id,
      updateObj,
      { new: true },
    );

    if (!updatedPorter) {
      return res.status(404).json({ error: "Porter not found" });
    }

    res.json({
      message: "Porter stats updated",
      data: updatedPorter,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 9. PORTER LOGIN
 * ========================================
 */
exports.loginPorter = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "username and password are required" });
    }

    const porter = await Porter.findOne({
      username: username.trim().toLowerCase(),
    }).select("+passwordHash");

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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 10. GET BOOKINGS FOR PORTER
 * ========================================
 */
exports.getPorterBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { assignedPorter: req.params.id };

    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 }).lean();

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
 * 11. ACCEPT BOOKING REQUEST
 * ========================================
 */
exports.acceptBooking = async (req, res) => {
  try {
    const { id, bookingId } = req.params;

    const booking = await Booking.findOne({
      _id: bookingId,
      assignedPorter: id,
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.status !== "requested") {
      return res
        .status(400)
        .json({ error: "Booking must be in requested status" });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: "assigned" },
      { new: true },
    );

    await Porter.findByIdAndUpdate(id, { isAvailable: false });

    res.json({
      message: "Booking accepted",
      data: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 12. DECLINE BOOKING REQUEST
 * ========================================
 */
exports.declineBooking = async (req, res) => {
  try {
    const { id, bookingId } = req.params;

    const booking = await Booking.findOne({
      _id: bookingId,
      assignedPorter: id,
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.status !== "requested") {
      return res
        .status(400)
        .json({ error: "Booking must be in requested status" });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: "cancelled" },
      { new: true },
    );

    res.json({
      message: "Booking declined",
      data: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * ========================================
 * 13. COMPLETE BOOKING
 * ========================================
 */
exports.completeBooking = async (req, res) => {
  try {
    const { id, bookingId } = req.params;

    const booking = await Booking.findOne({
      _id: bookingId,
      assignedPorter: id,
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.paymentStatus !== "paid") {
      return res.status(400).json({
        error: "Payment must be completed before marking the booking completed",
      });
    }

    if (!["assigned", "in_progress"].includes(booking.status)) {
      return res
        .status(400)
        .json({ error: "Booking must be assigned or in progress" });
    }

    const fare = Number(booking.estimatedFare || 0);

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: "completed", actualFare: fare },
      { new: true },
    );

    await Porter.findByIdAndUpdate(id, {
      $inc: {
        earnings: fare,
        completedBookings: 1,
        totalJobs: 1,
      },
      isAvailable: true,
    });

    res.json({
      message: "Booking completed",
      data: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
