# eKoolie Backend - Railway Porter Booking Platform

A MongoDB-focused Node.js + Express backend demonstrating advanced MongoDB concepts for college evaluation.

## Project Overview

eKoolie is an Uber-style platform for booking railway porters (coolies). This backend showcases:

- **Geospatial Queries**: Finding nearest porters using $near operator
- **Aggregation Pipelines**: Complex data transformations with $geoNear, $match, $sort
- **Array Operations**: Managing skills, items, and array elements with $push, $addToSet, $pull
- **Indexes**: 2dsphere, single-field, compound, and TTL indexes
- **Mongoose Relationships**: ObjectId references and population

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Geospatial**: GeoJSON Points for location queries
- **CORS**: Enabled for React frontend

---

## Project Structure

```
backend/
├── server.js                 # Main Express server
├── config/
│   └── database.js          # MongoDB connection setup
├── models/
│   ├── Porter.js            # Porter schema with indexes
│   ├── Booking.js           # Booking schema with references
│   └── Station.js           # Station reference data
├── controllers/
│   ├── porterController.js  # Porter operations
│   └── bookingController.js # Booking operations with geospatial queries
├── routes/
│   ├── porterRoutes.js      # Porter endpoints
│   └── bookingRoutes.js     # Booking endpoints
├── data/
│   ├── seedData.js          # Sample data seeding script
│   └── mongoQueries.js      # MongoDB query examples
└── package.json             # Dependencies
```

---

## Installation & Setup

### Prerequisites

- Node.js (v14+)
- MongoDB Server (local or Atlas)
- npm or yarn

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/ekoolie
PORT=5000
NODE_ENV=development
```

For MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ekoolie?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

### Step 3: Seed Sample Data

```bash
npm run seed
```

This will:

- Create 5 Railway Stations with GeoJSON coordinates
- Create 10 Porters with skills and ratings
- Create 3 Sample Bookings
- Set up all indexes (2dsphere, compound, TTL)

### Step 4: Start Server

```bash
npm start          # Production mode
npm run dev        # Development mode with nodemon
```

Expected output:

```
╔════════════════════════════════════════════════════════════════╗
║          EKOOLIE BACKEND SERVER STARTED                        ║
╠════════════════════════════════════════════════════════════════╣
║  Server:     http://localhost:5000                             ║
║  API Docs:   http://localhost:5000/api                         ║
║  Health:     http://localhost:5000/api/health                  ║
╚════════════════════════════════════════════════════════════════╝
```

---

## API Endpoints

### 1. PORTER ENDPOINTS

#### Add Porter

```bash
POST /api/porters
Content-Type: application/json

{
  "name": "Rajesh Kumar",
  "phone": "9876543210",
  "station": "Central Station",
  "maxLoad": 80,
  "location": {
    "type": "Point",
    "coordinates": [72.8247, 18.9676]
  },
  "skills": ["heavy luggage", "VIP service"]
}
```

#### Get All Porters (with filters)

```bash
# Get all porters
GET /api/porters

# Filter by station
GET /api/porters?station=Central%20Station

# Filter by availability
GET /api/porters?isAvailable=true

# Filter by minimum rating (demonstrates $gte)
GET /api/porters?minRating=4.5

# Combined filter
GET /api/porters?station=Central%20Station&isAvailable=true&minRating=4.5
```

#### Get Porter by ID

```bash
GET /api/porters/:id
```

#### Add Skill to Porter ($addToSet)

```bash
POST /api/porters/:id/skills
Content-Type: application/json

{
  "skill": "wheelchair assist"
}
```

#### Remove Skill from Porter ($pull)

```bash
DELETE /api/porters/:id/skills
Content-Type: application/json

{
  "skill": "old skill"
}
```

#### Update Porter Availability

```bash
PATCH /api/porters/:id/availability
Content-Type: application/json

{
  "isAvailable": false
}
```

#### Get Porters by Skill

```bash
GET /api/porters/filter/by-skill?skills=heavy%20luggage,VIP%20service
```

#### Update Porter Stats ($inc)

```bash
PATCH /api/porters/:id/stats
Content-Type: application/json

{
  "earnings": 500
}
```

---

### 2. BOOKING ENDPOINTS

#### Create Booking

```bash
POST /api/bookings
Content-Type: application/json

{
  "userId": "user_001",
  "userPhone": "9999999999",
  "station": "Central Station",
  "location": {
    "type": "Point",
    "coordinates": [72.8247, 18.9676]
  },
  "items": [
    { "name": "Suitcase", "weight": 25, "description": "Blue suitcase" },
    { "name": "Backpack", "weight": 8 }
  ],
  "specialRequests": "Handle with care"
}
```

#### Get All Bookings (with filters)

```bash
# Get all bookings
GET /api/bookings

# Filter by status
GET /api/bookings?status=pending

# Filter by user
GET /api/bookings?userId=user_001

# Filter by weight range (demonstrates $gte, $lte)
GET /api/bookings?minWeight=10&maxWeight=50

# Combined filters
GET /api/bookings?station=Central%20Station&status=completed&minWeight=10
```

#### Get Booking by ID

```bash
GET /api/bookings/:id
```

#### Find Nearest Available Porters (Geospatial $near)

⭐ **CORE UBER-STYLE FEATURE**

```bash
# Find nearest 5 porters to user location (within 5km)
GET /api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676

# Custom distance (10km)
GET /api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676&maxDistance=10000

# Filter by station
GET /api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676&station=Central%20Station

# Minimum capacity filter
GET /api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676&minCapacity=30

# Specific skill required
GET /api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676&skill=heavy%20luggage

# Get top 10 nearest
GET /api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676&limit=10
```

#### Assign Best Porter (Aggregation Pipeline)

⭐ **CORE MONGODB AGGREGATION FEATURE**

```bash
POST /api/bookings/:bookingId/assign-best-porter

# Response:
{
  "message": "Best porter assigned successfully",
  "assignment": {
    "porterName": "Harshit Yadav",
    "porterRating": 4.9,
    "distance": "0.45 km",
    "porterPhone": "9890123456"
  },
  "booking": { ... }
}
```

This endpoint demonstrates:

- **$geoNear**: Find porters near booking location
- **$match**: Filter by availability, capacity, station
- **$sort**: Sort by rating (best porter)
- **$limit**: Return top 1 result

#### Add Item to Booking ($push)

```bash
POST /api/bookings/:bookingId/items
Content-Type: application/json

{
  "name": "Additional Suitcase",
  "weight": 20,
  "description": "Red suitcase"
}
```

#### Update Booking Status

```bash
PATCH /api/bookings/:bookingId/status
Content-Type: application/json

{
  "status": "in_progress"
}
```

Valid statuses: `pending`, `assigned`, `in_progress`, `completed`, `cancelled`

---

## MongoDB Features Demonstrated

### 1. Geospatial Queries

```javascript
// Find porters within 5km using $near operator
db.porters.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [72.8247, 18.9676] },
      $maxDistance: 5000,
    },
  },
});
```

**Requires**: 2dsphere index on location field

### 2. Aggregation Pipeline

```javascript
// Best Porter Assignment Pipeline
db.porters.aggregate([
  {
    $geoNear: {
      near: booking.location,
      distanceField: "distance",
      maxDistance: 5000,
      spherical: true,
      query: { isAvailable: true, station: "Central Station" },
    },
  },
  { $match: { maxLoad: { $gte: 30 }, rating: { $gte: 4.0 } } },
  { $sort: { rating: -1 } },
  { $limit: 1 },
]);
```

### 3. Array Operations

```javascript
// Add skill without duplicates
db.porters.updateOne(
  { _id: ObjectId("...") },
  { $addToSet: { skills: "new skill" } },
);

// Remove skill
db.porters.updateOne(
  { _id: ObjectId("...") },
  { $pull: { skills: "old skill" } },
);

// Add item to booking
db.bookings.updateOne(
  { _id: ObjectId("...") },
  { $push: { items: { name: "Suitcase", weight: 25 } } },
);
```

### 4. Comparison Operators

```javascript
// $gte (greater than or equal)
db.porters.find({ rating: { $gte: 4.5 } });

// $lte (less than or equal)
db.bookings.find({ totalWeight: { $lte: 50 } });

// Range query
db.bookings.find({ totalWeight: { $gte: 10, $lte: 50 } });
```

### 5. Indexes

```javascript
// 2dsphere index for geospatial queries
db.porters.createIndex({ location: "2dsphere" });

// Single field index
db.porters.createIndex({ station: 1 });

// Compound index
db.porters.createIndex({ station: 1, isAvailable: 1 });

// TTL index for auto-deletion
db.bookings.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 86400, partialFilterExpression: { status: "pending" } },
);
```

---

## Example API Workflow (Complete Booking Flow)

### 1. Create a Booking

```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
    "userPhone": "9999999999",
    "station": "Central Station",
    "location": { "type": "Point", "coordinates": [72.8247, 18.9676] },
    "items": [{ "name": "Suitcase", "weight": 25 }],
    "specialRequests": "Quick service"
  }'
```

### 2. Find Nearest Porters

```bash
curl "http://localhost:5000/api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676&maxDistance=5000"
```

### 3. Assign Best Porter (Aggregation Pipeline)

```bash
curl -X POST http://localhost:5000/api/bookings/BOOKING_ID/assign-best-porter
```

### 4. Check Booking Status

```bash
curl "http://localhost:5000/api/bookings/BOOKING_ID"
```

### 5. Update Booking Status

```bash
curl -X PATCH http://localhost:5000/api/bookings/BOOKING_ID/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "in_progress" }'
```

---

## MongoDB Query Examples

See `data/mongoQueries.js` for complete MongoDB shell queries demonstrating:

- Basic find queries
- Array operations ($in, $all)
- Geospatial queries ($near, $geoWithin)
- **Aggregation pipelines** ($geoNear, $match, $group, $sort)
- Update operations ($addToSet, $pull, $inc)
- Complex filters ($or, $and)
- Query explanation and indexing

---

## Data Schema

### Porter

```javascript
{
  _id: ObjectId,
  name: String,
  phone: String,                    // Unique
  station: String (enum),
  rating: Number (1-5),
  totalJobs: Number,
  isAvailable: Boolean,
  maxLoad: Number,
  location: GeoJSON Point,          // [longitude, latitude]
  skills: [String],                 // Array of skills
  earnings: Number,
  completedBookings: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:

- 2dsphere on `location` (geospatial)
- Ascending on `station`
- Compound `(station, isAvailable)`
- Compound `(isAvailable, rating desc)`
- Compound `(location 2dsphere, isAvailable)`

### Booking

```javascript
{
  _id: ObjectId,
  userId: String,
  userPhone: String,
  station: String (enum),
  location: GeoJSON Point,
  status: String (enum: pending, assigned, in_progress, completed, cancelled),
  assignedPorter: ObjectId (ref: Porter),
  items: [{
    name: String,
    weight: Number,
    description: String
  }],
  totalWeight: Number,
  estimatedFare: Number,
  actualFare: Number,
  specialRequests: String,
  rating: Number (1-5),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:

- Ascending on `status`
- Compound `(userId, status)`
- Ascending on `assignedPorter`
- Compound `(station, status)`
- TTL on `createdAt` (auto-delete after 24h if pending)

### Station

```javascript
{
  _id: ObjectId,
  name: String,
  city: String,
  location: GeoJSON Point,
  totalPlatforms: Number,
  activePorpers: Number,
  peakHours: [String],
  phone: String,
  email: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Performance Tips Explained

### 1. Why Indexes Matter

**Without index**:

```javascript
db.porters.find({ station: "Central Station" });
// Scans ALL 10,000 documents in collection - SLOW!
```

**With index**:

```javascript
// Creates B-tree structure, direct lookup - FAST!
// Query performance: ~1ms instead of ~500ms
```

### 2. Compound Indexes

```javascript
// Good for this query:
db.porters.find({ station: "Central Station", isAvailable: true });

// Create compound index:
db.porters.createIndex({ station: 1, isAvailable: 1 });
```

### 3. 2dsphere Index for Geospatial

```javascript
// Without 2dsphere index, $near queries FAIL
db.porters.createIndex({ location: "2dsphere" });

// Now $near queries work efficiently in O(log n) time
```

### 4. Lean Queries in Mongoose

```javascript
// Without .lean() - Returns Mongoose documents (heavier)
const porters = await Porter.find(filter);

// With .lean() - Returns plain JS objects (lighter & faster)
const porters = await Porter.find(filter).lean();
// Performance improvement: ~40% faster
```

---

## Testing with Postman/cURL

### Import Sample Requests

Create `ekoolie.postman_collection.json` in your project root and import to Postman.

### Quick Test Commands

```bash
# Health check
curl http://localhost:5000/api/health

# Get all porters
curl http://localhost:5000/api/porters

# Get available porters
curl "http://localhost:5000/api/porters?isAvailable=true"

# Get high-rated porters (≥ 4.5)
curl "http://localhost:5000/api/porters?minRating=4.5"

# Find nearest 5 porters
curl "http://localhost:5000/api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676&limit=5"
```

---

## MongoDB Aggregation Explained for Viva

### Pipeline Stages (Like Assembly Line)

1. **$geoNear** - Find items closest to location
2. **$match** - Filter items matching criteria
3. **$sort** - Order items
4. **$limit** - Take top N items
5. **$project** - Select specific fields

**Real-world analogy**:

- $geoNear = Finding nearby restaurants
- $match = Filtering by open hours
- $sort = Sort by rating
- $limit = Show top 5
- $project = Show only name, rating, distance

---

## College Evaluation Keywords

This project demonstrates:

✅ **CRUD Operations** - Create, Read, Update, Delete porters & bookings
✅ **Geospatial Queries** - $near operator with 2dsphere index
✅ **Aggregation Pipelines** - Multi-stage data transformation
✅ **Array Operations** - $push, $addToSet, $pull for dynamic arrays
✅ **Comparison Operators** - $gte, $lte, $gt, $lt, $eq, $ne, $in
✅ **Indexing Strategy** - Single-field, compound, geospatial, TTL
✅ **Relationships** - ObjectId references with populate
✅ **Error Handling** - Proper HTTP status codes and validation
✅ **Real-World Use Case** - Uber-style porter assignment

---

## Troubleshooting

### MongoDB Connection Error

```
✗ MongoDB Connection Failed: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Start MongoDB service

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud)
```

### GeoJSON Format Error

```
"Location must be GeoJSON Point: { type: "Point", coordinates: [longitude, latitude] }"
```

**Solution**: Always use `[longitude, latitude]` order, not `[latitude, longitude]`

### 2dsphere Index Not Found

```
error: "can't find geo index for $near query"
```

**Solution**: Create 2dsphere index:

```bash
db.porters.createIndex({ location: '2dsphere' })
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**: Change PORT in .env or kill existing process

```bash
lsof -i :5000
kill -9 <PID>
```

---

## Next Steps for Enhancement

1. **Authentication** - Add JWT for user authentication
2. **Real-time Updates** - WebSocket for live porter tracking
3. **Payment Integration** - Stripe/Razorpay for payments
4. **Rating System** - Store review comments and photos
5. **Historical Analytics** - Dashboard for booking trends
6. **Caching** - Redis for frequently accessed data
7. **Transactions** - Multi-document ACID transactions for complex operations

---

## References

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Geospatial Queries](https://docs.mongodb.com/manual/geospatial-queries/)
- [Aggregation Pipeline](https://docs.mongodb.com/manual/aggregation/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [GeoJSON Specification](https://geojson.org/)

---

## License

ISC

## Author

eKoolie Development Team

---

**Ready for college evaluation!** 🎓

This backend demonstrates strong MongoDB concepts through a real-world Uber-style booking platform. All queries, indexes, and aggregation pipelines are well-commented and optimized for learning.
