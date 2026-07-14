// eKoolie Backend — Railway Porter Booking Platform
// Express + MongoDB/Mongoose, with geospatial matching and aggregation-based
// porter assignment (see controllers/bookingController.js).

require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173", // Vite dev server
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
