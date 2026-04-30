/**
 * DATABASE CONFIGURATION
 *
 * This file handles MongoDB connection setup using Mongoose.
 * Connection pooling is automatically managed by Mongoose.
 */

const mongoose = require("mongoose");
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ekoolie";

/**
 * Connect to MongoDB
 * Mongoose handles connection pooling and automatic retries
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ MongoDB Connected Successfully");
    console.log(`  Database: ${mongoose.connection.db.name}`);
  } catch (error) {
    console.error("✗ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
