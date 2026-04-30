/**
 * ========================================
 * SAMPLE DATA SEEDING SCRIPT
 * ========================================
 *
 * Run with: npm run seed
 *
 * This script populates MongoDB with sample data:
 * - 10 Porters with realistic data
 * - 5 Railway Stations with GeoJSON coordinates
 * - Sample Bookings
 *
 * Use this data for testing MongoDB queries and features
 */

require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Porter = require("../models/Porter");
const Station = require("../models/Station");
const Booking = require("../models/Booking");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ekoolie";

const DEFAULT_PORTER_PASSWORD = "porter123";

/**
 * ========================================
 * STATION DATA (10 Metropolitan Cities)
 * ========================================
 *
 * Coordinates: [longitude, latitude]
 * Stations chosen as representative central railway/transport hubs
 */
const stationsData = [
  {
    name: "New Delhi Station",
    city: "New Delhi",
    location: { type: "Point", coordinates: [77.209, 28.6139] },
    totalPlatforms: 16,
    activePorpers: 12,
    peakHours: ["07:00-10:00", "17:00-20:00"],
    phone: "+91-11-1111-0000",
    email: "newdelhi@station.com",
  },
  {
    name: "Mumbai Central",
    city: "Mumbai",
    location: { type: "Point", coordinates: [72.8356, 18.9402] },
    totalPlatforms: 18,
    activePorpers: 15,
    peakHours: ["07:00-10:00", "17:00-20:00"],
    phone: "+91-22-1111-0001",
    email: "mumbai@station.com",
  },
  {
    name: "Howrah Junction",
    city: "Kolkata",
    location: { type: "Point", coordinates: [88.2636, 22.5958] },
    totalPlatforms: 23,
    activePorpers: 18,
    peakHours: ["06:30-09:30", "16:30-19:30"],
    phone: "+91-33-1111-0002",
    email: "howrah@station.com",
  },
  {
    name: "Bengaluru City",
    city: "Bengaluru",
    location: { type: "Point", coordinates: [77.5946, 12.9716] },
    totalPlatforms: 10,
    activePorpers: 9,
    peakHours: ["08:00-10:00", "18:00-20:00"],
    phone: "+91-80-1111-0003",
    email: "bengaluru@station.com",
  },
  {
    name: "Chennai Central",
    city: "Chennai",
    location: { type: "Point", coordinates: [80.2707, 13.0827] },
    totalPlatforms: 12,
    activePorpers: 10,
    peakHours: ["07:00-09:30", "17:00-19:30"],
    phone: "+91-44-1111-0004",
    email: "chennai@station.com",
  },
  {
    name: "Hyderabad Deccan",
    city: "Hyderabad",
    location: { type: "Point", coordinates: [78.4867, 17.385] },
    totalPlatforms: 8,
    activePorpers: 7,
    peakHours: ["07:30-10:00", "17:30-20:00"],
    phone: "+91-40-1111-0005",
    email: "hyderabad@station.com",
  },
  {
    name: "Pune Junction",
    city: "Pune",
    location: { type: "Point", coordinates: [73.8567, 18.5204] },
    totalPlatforms: 7,
    activePorpers: 6,
    peakHours: ["08:00-10:00", "18:00-20:00"],
    phone: "+91-20-1111-0006",
    email: "pune@station.com",
  },
  {
    name: "Ahmedabad Junction",
    city: "Ahmedabad",
    location: { type: "Point", coordinates: [72.5714, 23.0225] },
    totalPlatforms: 9,
    activePorpers: 7,
    peakHours: ["07:00-09:30", "17:00-19:30"],
    phone: "+91-79-1111-0007",
    email: "ahmedabad@station.com",
  },
  {
    name: "Lucknow Charbagh",
    city: "Lucknow",
    location: { type: "Point", coordinates: [80.9462, 26.8467] },
    totalPlatforms: 10,
    activePorpers: 8,
    peakHours: ["06:30-09:00", "17:00-19:30"],
    phone: "+91-522-1111-0008",
    email: "lucknow@station.com",
  },
  {
    name: "Patiala Station",
    city: "Patiala",
    location: { type: "Point", coordinates: [76.3869, 30.3398] },
    totalPlatforms: 4,
    activePorpers: 3,
    peakHours: ["07:30-09:30", "17:30-19:30"],
    phone: "+91-1762-1111-0009",
    email: "patiala@station.com",
  },
];

/**
 * ========================================
 * PORTER DATA (Sample Porters)
 * ========================================
 *
 * Demonstrates:
 * - GeoJSON Point locations
 * - Array of skills
 * - Various ratings and loads
 * - Mixed availability
 *
 * Each porter is positioned within 5km of a station
 */
const portersData = [
  {
    name: "Rajesh Kumar",
    phone: "9876543210",
    station: "New Delhi Station",
    rating: 4.8,
    totalJobs: 250,
    isAvailable: true,
    maxLoad: 80,
    location: { type: "Point", coordinates: [77.209, 28.6139] },
    skills: ["heavy luggage", "VIP service", "express service"],
    earnings: 45000,
    completedBookings: 250,
  },
  {
    name: "Priya Sharma",
    phone: "9123456789",
    station: "Mumbai Central",
    rating: 4.6,
    totalJobs: 180,
    isAvailable: true,
    maxLoad: 60,
    location: { type: "Point", coordinates: [72.8356, 18.9402] },
    skills: ["fragile items", "VIP service", "wheelchair assist"],
    earnings: 32000,
    completedBookings: 180,
  },
  {
    name: "Amit Patel",
    phone: "9234567890",
    station: "Howrah Junction",
    rating: 4.5,
    totalJobs: 150,
    isAvailable: true,
    maxLoad: 90,
    location: { type: "Point", coordinates: [88.2636, 22.5958] },
    skills: ["heavy luggage", "express service", "stair assistance"],
    earnings: 28000,
    completedBookings: 150,
  },
  {
    name: "Mahesh Singh",
    phone: "9345678901",
    station: "Bengaluru City",
    rating: 4.2,
    totalJobs: 95,
    isAvailable: false,
    maxLoad: 70,
    location: { type: "Point", coordinates: [77.5946, 12.9716] },
    skills: ["heavy luggage", "VIP service"],
    earnings: 18000,
    completedBookings: 95,
  },
  {
    name: "Deepak Verma",
    phone: "9456789012",
    station: "Chennai Central",
    rating: 4.7,
    totalJobs: 200,
    isAvailable: true,
    maxLoad: 85,
    location: { type: "Point", coordinates: [80.2707, 13.0827] },
    skills: [
      "heavy luggage",
      "fragile items",
      "express service",
      "wheelchair assist",
    ],
    earnings: 41000,
    completedBookings: 200,
  },
  {
    name: "Suresh Gupta",
    phone: "9567890123",
    station: "Hyderabad Deccan",
    rating: 4.3,
    totalJobs: 110,
    isAvailable: true,
    maxLoad: 65,
    location: { type: "Point", coordinates: [78.4867, 17.385] },
    skills: ["VIP service", "fragile items"],
    earnings: 19000,
    completedBookings: 110,
  },
  {
    name: "Vikram Reddy",
    phone: "9678901234",
    station: "Pune Junction",
    rating: 4.4,
    totalJobs: 130,
    isAvailable: true,
    maxLoad: 75,
    location: { type: "Point", coordinates: [73.8567, 18.5204] },
    skills: ["heavy luggage", "express service", "stair assistance"],
    earnings: 22000,
    completedBookings: 130,
  },
  {
    name: "Arjun Nair",
    phone: "9789012345",
    station: "Ahmedabad Junction",
    rating: 4.1,
    totalJobs: 75,
    isAvailable: false,
    maxLoad: 55,
    location: { type: "Point", coordinates: [72.5714, 23.0225] },
    skills: ["fragile items"],
    earnings: 12000,
    completedBookings: 75,
  },
  {
    name: "Harshit Yadav",
    phone: "9890123456",
    station: "Lucknow Charbagh",
    rating: 4.9,
    totalJobs: 280,
    isAvailable: true,
    maxLoad: 95,
    location: { type: "Point", coordinates: [80.9462, 26.8467] },
    skills: [
      "heavy luggage",
      "VIP service",
      "fragile items",
      "express service",
      "wheelchair assist",
    ],
    earnings: 52000,
    completedBookings: 280,
  },
  {
    name: "Nikhil Das",
    phone: "9901234567",
    station: "Patiala Station",
    rating: 4.0,
    totalJobs: 60,
    isAvailable: true,
    maxLoad: 50,
    location: { type: "Point", coordinates: [76.3869, 30.3398] },
    skills: ["fragile items", "wheelchair assist"],
    earnings: 9000,
    completedBookings: 60,
  },
  // Additional porters for Mumbai and New Delhi (added per request)
  {
    name: "Sanjay Rao",
    phone: "9912340001",
    station: "Mumbai Central",
    rating: 4.4,
    totalJobs: 140,
    isAvailable: true,
    maxLoad: 80,
    location: { type: "Point", coordinates: [72.836, 18.941] },
    skills: ["heavy luggage", "express service"],
    earnings: 30000,
    completedBookings: 140,
  },
  {
    name: "Neha Kapoor",
    phone: "9912340002",
    station: "Mumbai Central",
    rating: 4.5,
    totalJobs: 160,
    isAvailable: true,
    maxLoad: 70,
    location: { type: "Point", coordinates: [72.835, 18.9395] },
    skills: ["fragile items", "VIP service"],
    earnings: 34000,
    completedBookings: 160,
  },
  {
    name: "Rohit Mehra",
    phone: "9912340003",
    station: "New Delhi Station",
    rating: 4.3,
    totalJobs: 120,
    isAvailable: true,
    maxLoad: 75,
    location: { type: "Point", coordinates: [77.2085, 28.6145] },
    skills: ["heavy luggage", "stair assistance"],
    earnings: 26000,
    completedBookings: 120,
  },
  {
    name: "Anita Verma",
    phone: "9912340004",
    station: "New Delhi Station",
    rating: 4.6,
    totalJobs: 190,
    isAvailable: true,
    maxLoad: 65,
    location: { type: "Point", coordinates: [77.2095, 28.613] },
    skills: ["wheelchair assist", "VIP service"],
    earnings: 36000,
    completedBookings: 190,
  },
];

const usedUsernames = new Set();
const buildUsername = (name) => {
  const base = String(name || "porter")
    .trim()
    .toLowerCase()
    .split(/\s+/)[0]
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 14);

  let username = base || "porter";
  let suffix = 1;
  while (usedUsernames.has(username)) {
    suffix += 1;
    username = `${base}${suffix}`;
  }
  usedUsernames.add(username);
  return username;
};

/**
 * ========================================
 * BOOKING DATA (Sample Bookings)
 * ========================================
 */
const bookingsData = [
  {
    userId: "user_001",
    userPhone: "9999999999",
    station: "Central Station",
    location: {
      type: "Point",
      coordinates: [72.8247, 18.9676],
    },
    status: "completed",
    items: [
      { name: "Large Suitcase", weight: 25, description: "Blue suitcase" },
      { name: "Backpack", weight: 8, description: "Travel backpack" },
    ],
    totalWeight: 33,
    estimatedFare: 380,
    actualFare: 400,
    specialRequests: "Be careful with suitcase",
    rating: 5,
  },
  {
    userId: "user_002",
    userPhone: "8888888888",
    station: "West Station",
    location: {
      type: "Point",
      coordinates: [72.8272, 19.0176],
    },
    status: "completed",
    items: [{ name: "Fragile Box", weight: 12, description: "Electronics" }],
    totalWeight: 12,
    estimatedFare: 170,
    actualFare: 180,
    specialRequests: "Handle with care - electronics inside",
    rating: 5,
  },
  {
    userId: "user_003",
    userPhone: "7777777777",
    station: "East Station",
    location: {
      type: "Point",
      coordinates: [72.9789, 19.2183],
    },
    status: "pending",
    items: [
      { name: "Trolley Bag", weight: 30, description: "Black trolley" },
      { name: "Personal Bag", weight: 5, description: "Shoulder bag" },
    ],
    totalWeight: 35,
    estimatedFare: 400,
    actualFare: null,
    specialRequests: "Quick service needed",
    rating: null,
  },
];

/**
 * ========================================
 * SEED FUNCTION
 * ========================================
 */
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ Connected to MongoDB");

    // Clear existing data
    await Porter.deleteMany({});
    await Station.deleteMany({});
    await Booking.deleteMany({});

    console.log("✓ Cleared existing data");

    // Insert stations
    const savedStations = await Station.insertMany(stationsData);
    console.log(`✓ Inserted ${savedStations.length} stations`);

    // Insert porters with login credentials
    const portersWithAuth = await Promise.all(
      portersData.map(async (porter) => {
        const username = porter.username || buildUsername(porter.name);
        const passwordHash = await bcrypt.hash(DEFAULT_PORTER_PASSWORD, 10);

        return {
          ...porter,
          username,
          passwordHash,
        };
      }),
    );

    const savedPorters = await Porter.insertMany(portersWithAuth);
    console.log(`✓ Inserted ${savedPorters.length} porters`);

    // Update bookings with porter references
    const firstPorter = savedPorters[0];
    bookingsData[0].assignedPorter = firstPorter._id;
    bookingsData[0].status = "completed";

    const secondPorter = savedPorters[1];
    bookingsData[1].assignedPorter = secondPorter._id;
    bookingsData[1].status = "completed";

    // Insert bookings
    const savedBookings = await Booking.insertMany(bookingsData);
    console.log(`✓ Inserted ${savedBookings.length} bookings`);

    /**
     * ========================================
     * VERIFY INDEXES
     * ========================================
     */
    const porterIndexes = await Porter.collection.getIndexes();
    console.log("\n✓ Porter Indexes Created:");
    Object.keys(porterIndexes).forEach((idx) => {
      console.log(`  - ${idx}`);
    });

    const bookingIndexes = await Booking.collection.getIndexes();
    console.log("\n✓ Booking Indexes Created:");
    Object.keys(bookingIndexes).forEach((idx) => {
      console.log(`  - ${idx}`);
    });

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║          DATABASE SEEDING COMPLETED                           ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Sample Data Inserted:                                         ║
║  ✓ ${savedStations.length} Railway Stations                              
║  ✓ ${savedPorters.length} Porters with skills and ratings                 
║  ✓ ${savedBookings.length} Sample Bookings                               
║                                                                ║
║  Indexes Created:                                              ║
║  ✓ 2dsphere (geospatial queries)                               ║
║  ✓ Single field indexes                                        ║
║  ✓ Compound indexes                                            ║
║                                                                ║
║  Ready for API testing!                                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);

    await mongoose.connection.close();
    console.log("✓ Database connection closed");
  } catch (error) {
    console.error("✗ Error seeding database:", error.message);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
