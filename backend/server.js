// eKoolie Backend — Railway Porter Booking Platform
// Express + MongoDB/Mongoose, with geospatial matching and aggregation-based
// porter assignment (see controllers/bookingController.js).

require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// FRONTEND_URL is the deployed Vercel/Netlify origin in production; localhost
// stays allowed too so local dev against a deployed backend still works.
const allowedOrigins = ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // required for the httpOnly refresh-token cookie
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectDB();

app.use("/api", routes);

// 404 for anything under /api that didn't match a route above
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found", path: req.originalUrl });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`eKoolie backend listening on http://localhost:${PORT}`);
  console.log(`API docs:   http://localhost:${PORT}/api`);
  console.log(`Health:     http://localhost:${PORT}/api/health`);
});

module.exports = app;
