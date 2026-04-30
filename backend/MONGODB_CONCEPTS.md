/\*\*

- ========================================
- MONGODB CONCEPTS EXPLAINED FOR VIVA
- ========================================
-
- Simplified explanations of advanced MongoDB concepts
- used in the eKoolie backend
-
- Use this to prepare for college evaluation/viva
  \*/

// ========================================
// 1. GEOSPATIAL QUERIES ($near)
// ========================================

/\*\*

- CONCEPT: Finding items closest to a location
-
- REAL-WORLD ANALOGY:
- Imagine you're at Mumbai Central Station and need a porter.
- Instead of checking all 50,000 porters in the city,
- MongoDB instantly finds the 5 nearest to you.
-
- HOW IT WORKS:
- - MongoDB stores location as GeoJSON Point: [longitude, latitude]
- - Creates 2dsphere index (sphere-shaped geographic index)
- - Calculates distance from your location to each porter
- - Returns sorted by distance (closest first)
-
- WITHOUT GEOSPATIAL QUERY:
- 1.  Fetch all 50,000 porters
- 2.  Calculate distance for each manually (in JavaScript)
- 3.  Sort by distance
- 4.  Return top 5
- Time: ~5 seconds ❌
-
- WITH $near QUERY:
- 1.  MongoDB instantly finds 5 nearest
- 2.  Returns sorted
- Time: ~50 milliseconds ✓ (100x faster!)
-
- CODE:
  \*/
  db.porters.find({
  location: {
  $near: {
  $geometry: {
  type: 'Point',
  coordinates: [72.8247, 18.9676] // [longitude, latitude]
  },
  $maxDistance: 5000 // 5km in meters
  }
  }
  })

/\*\*

- FOR VIVA EXPLANATION:
-
- "I used MongoDB's $near operator for geospatial queries.
- It efficiently finds porters closest to the user's location.
- The $near operator requires:
- 1.  GeoJSON Point format for location data
- 2.  2dsphere index on the location field
-
- Instead of checking all porters (O(n) complexity),
- the index enables O(log n) search on the sphere.
- This allows real-time queries even with millions of porters."
  \*/

// ========================================
// 2. AGGREGATION PIPELINE ($geoNear, $match, $sort)
// ========================================

/\*\*

- CONCEPT: Multi-stage data processing on the server side
-
- REAL-WORLD ANALOGY:
- Assembly line in a factory:
- - Stage 1: Get raw materials from storage
- - Stage 2: Filter defective items
- - Stage 3: Sort by quality
- - Stage 4: Package and ship
-
- MONGODB AGGREGATION ANALOGY:
- - Stage 1: Find porters near location ($geoNear)
- - Stage 2: Filter by availability & capacity ($match)
- - Stage 3: Sort by rating ($sort)
- - Stage 4: Get top 1 result ($limit)
-
- BENEFITS:
- - All processing happens on MongoDB server (not JavaScript)
- - Processes data in memory (very fast)
- - Optimized indexes support each stage
- - Can handle millions of documents efficiently
-
- CODE:
  \*/
  db.porters.aggregate([
  // Stage 1: Find porters near location (requires 2dsphere index)
  {
  $geoNear: {
  near: { type: 'Point', coordinates: [72.8247, 18.9676] },
  distanceField: 'distance',
  maxDistance: 5000,
  spherical: true,
  query: {
  isAvailable: true,
  station: 'Central Station'
  }
  }
  },

// Stage 2: Filter by additional criteria
{
$match: {
maxLoad: { $gte: 30 }, // Can carry 30+ kg
rating: { $gte: 4.0 } // Good rating
}
},

// Stage 3: Sort by rating (best first)
{
$sort: { rating: -1 }
},

// Stage 4: Get only top 1 (best porter)
{
$limit: 1
}
])

/\*\*

- FOR VIVA EXPLANATION:
-
- "I used MongoDB aggregation pipeline for complex operations.
- The pipeline passes data through multiple stages:
-
- 1.  $geoNear: Finds porters within 5km with distance calculation
- 2.  $match: Filters porters by availability and capacity
- 3.  $sort: Sorts by rating (highest first)
- 4.  $limit: Returns only the best porter
-
- All processing happens server-side on MongoDB, not in Node.js.
- This is much more efficient than:
- - Loading all porters into Node.js memory
- - Processing in JavaScript loops
-
- Result: Instant Uber-style porter assignment!"
  \*/

// ========================================
// 3. ARRAY OPERATIONS ($push, $addToSet, $pull)
// ========================================

/\*\*

- CONCEPT: Modifying arrays within documents
-
- USE CASE: Porters have multiple skills
- Example: ["heavy luggage", "VIP service", "fragile items"]
-
- Three operations:
  \*/

// A) $addToSet - Add without duplicates (Set behavior)
db.porters.updateOne(
{ \_id: ObjectId('...') },
{ $addToSet: { skills: 'wheelchair assist' } }
)
// Result: Skill added ONLY if it doesn't already exist
// If it exists: No change, no error

// B) $push - Add element (allows duplicates)
db.porters.updateOne(
{ \_id: ObjectId('...') },
{ $push: { skills: 'wheelchair assist' } }
)
// Result: Skill added even if it already exists
// Creates: ["wheelchair assist", "wheelchair assist"]

// C) $pull - Remove element
db.porters.updateOne(
{ \_id: ObjectId('...') },
{ $pull: { skills: 'old skill' } }
)
// Result: All instances of 'old skill' removed

/\*\*

- BOOKING EXAMPLE: Adding items
  \*/
  db.bookings.updateOne(
  { \_id: ObjectId('...') },
  {
  $push: {
  items: {
  name: 'Suitcase',
  weight: 25,
  description: 'Blue luggage'
  }
  }
  }
  )
  // Result: New item added to items array

/\*\*

- FOR VIVA EXPLANATION:
-
- "I used MongoDB array operators to manage complex nested data:
-
- $addToSet: For unique skills (no duplicates)
- - Porter can't have same skill twice
-
- $push: For booking items (duplicates allowed)
- - User can add multiple suitcases of same weight
-
- $pull: To remove items
- - Remove a skill from porter's profile
-
- These are much more efficient than:
- - Fetching entire document
- - Modifying array in Node.js
- - Sending entire array back to MongoDB
-
- MongoDB operators work directly on arrays!"
  \*/

// ========================================
// 4. INDEXING STRATEGY
// ========================================

/\*\*

- CONCEPT: Creating shortcuts for data lookups
-
- ANALOGY: Phone book index
- Without index: Read 1000 pages sequentially ❌
- With index: Open to first letter, direct lookup ✓
-
- MONGODB WITHOUT INDEX:
- db.porters.find({ station: 'Central Station' })
- MongoDB must check EVERY document
- 1 million porters = 1 million checks
- Time: 500ms - 1 second ❌
-
- MONGODB WITH INDEX:
- db.porters.createIndex({ station: 1 })
- MongoDB uses B-tree structure for fast lookup
- 1 million porters = ~20 checks (binary search)
- Time: 1-5ms ✓ (100x faster!)
  \*/

// Different types of indexes:

// 1. SINGLE FIELD INDEX
db.porters.createIndex({ station: 1 })
// Use for: find({ station: 'Central Station' })

// 2. COMPOUND INDEX (multiple fields)
db.porters.createIndex({ station: 1, isAvailable: 1 })
// Use for: find({ station: 'X', isAvailable: true })
// Also helps: find({ station: 'X' }) - uses first part

// 3. GEOSPATIAL INDEX (2dsphere)
db.porters.createIndex({ location: '2dsphere' })
// Required for: $near queries
// Enables: Fast geographic lookups

// 4. TTL INDEX (Time-To-Live)
db.bookings.createIndex(
{ createdAt: 1 },
{
expireAfterSeconds: 86400,
partialFilterExpression: { status: 'pending' }
}
)
// Effect: Auto-delete pending bookings after 24 hours
// MongoDB background task runs every 60 seconds

/\*\*

- FOR VIVA EXPLANATION:
-
- "I implemented a comprehensive indexing strategy:
-
- 1.  Single field index on 'station' for fast station lookup
- 2.  Compound index (station, isAvailable) for combined filters
- 3.  2dsphere geospatial index for $near queries
- 4.  TTL index to auto-delete old pending bookings
-
- Without proper indexes:
- - Query: 1 second
- With indexes:
- - Query: 5 milliseconds
-
- Indexes use B-tree data structure:
- - Binary search: O(log n) instead of O(n)
- - Trade-off: Indexes take disk space
- - Worth it: Query performance >> storage cost"
    \*/

// ========================================
// 5. OPERATORS: $gte, $lte, $in, $or, $and
// ========================================

/\*\*

- COMPARISON OPERATORS
  \*/

// $gte (Greater Than or Equal)
db.porters.find({ rating: { $gte: 4.5 } })
// "Find porters with rating 4.5 or higher"

// $lte (Less Than or Equal)
db.bookings.find({ totalWeight: { $lte: 50 } })
// "Find bookings with 50kg or less luggage"

// $gt (Greater Than)
db.porters.find({ totalJobs: { $gt: 100 } })
// "Find experienced porters with more than 100 jobs"

// $lt (Less Than)
db.porters.find({ maxLoad: { $lt: 30 } })
// "Find porters who can carry less than 30kg"

/\*\*

- RANGE QUERY: Combine operators
  \*/
  db.bookings.find({
  totalWeight: {
  $gte: 10,
  $lte: 50
  }
  })
  // "Find bookings between 10kg and 50kg"

/\*\*

- $in OPERATOR: Match any value
  \*/
  db.porters.find({
  skills: { $in: ['heavy luggage', 'VIP service'] }
  })
  // "Find porters with heavy luggage OR VIP service skill"

/\*\*

- $or OPERATOR: Match any condition
  \*/
  db.porters.find({
  $or: [
  { rating: { $gt: 4.5 } },
  { maxLoad: { $gt: 80 } }
  ]
  })
  // "Find porters with high rating OR high capacity"

/\*\*

- $and OPERATOR: Match all conditions (explicit)
  \*/
  db.porters.find({
  $and: [
  { isAvailable: true },
  { station: 'Central Station' },
  { maxLoad: { $gte: 50 } }
  ]
  })
  // "Available porters at Central Station with 50+ capacity"
  // Note: find({...}) is implicit AND, $and is explicit

/\*\*

- FOR VIVA EXPLANATION:
-
- "I used MongoDB operators for flexible filtering:
-
- Comparison operators:
- - $gte, $lte for range queries
- - Enables features like 'filter by weight range'
-
- Array operators:
- - $in for multiple matching values
- - Used for skill filtering
-
- Logical operators:
- - $or, $and for complex conditions
- - Enables 'find porters with skill X OR Y'
-
- These operators make queries flexible and powerful!"
  \*/

// ========================================
// 6. DOCUMENT REFERENCES & POPULATION
// ========================================

/\*\*

- CONCEPT: Linking documents using ObjectId
-
- ANALOGY: Foreign key in SQL
- SQL: CREATE TABLE bookings (porter_id INT FOREIGN KEY)
- MongoDB: assignedPorter: ObjectId (reference)
-
- SCHEMA:
  \*/
  // Porter document:
  {
  \_id: ObjectId("507f1f77bcf86cd799439010"),
  name: 'Rajesh Kumar',
  rating: 4.8,
  phone: '9876543210'
  }

// Booking document:
{
\_id: ObjectId("507f1f77bcf86cd799439011"),
userId: 'user_001',
assignedPorter: ObjectId("507f1f77bcf86cd799439010"), // Reference!
status: 'assigned'
}

/\*\*

- WITHOUT population:
- assignedPorter is just: ObjectId("507f1f77bcf86cd799439010")
- Need to do: db.porters.find(\_id: that_id)
- Two database queries! ❌
-
- WITH population:
- Mongoose fetches complete Porter document
- Get: { \_id, name, rating, phone }
- One nice query! ✓
  \*/

// MONGOOSE CODE:
// Without populate:
const booking = await Booking.findById(bookingId)
// Result: booking.assignedPorter = ObjectId("...")

// With populate:
const booking = await Booking.findById(bookingId)
.populate('assignedPorter')
// Result: booking.assignedPorter = { \_id, name, rating, phone... }

// Populate only specific fields:
const booking = await Booking.findById(bookingId)
.populate('assignedPorter', 'name rating phone') // Only these fields

/\*\*

- FOR VIVA EXPLANATION:
-
- "I used MongoDB document references (ObjectId) to link collections:
-
- Booking document has 'assignedPorter' field containing Porter's ObjectId
- This is similar to SQL foreign key relationship
-
- Mongoose provides .populate() to fetch referenced documents
- Single query returns booking with full porter details
-
- Benefits:
- - Avoid data duplication
- - Update porter info once, affects all bookings
- - Normalized data structure
-
- Trade-off:
- - Requires extra query (handled by populate)
- - But worth it for data integrity!"
    \*/

// ========================================
// 7. PERFORMANCE & OPTIMIZATION
// ========================================

/\*\*

- OPTIMIZATION 1: .lean() in Mongoose
  \*/
  // Standard find (slower):
  const porters = await Porter.find({ isAvailable: true })
  // Returns Mongoose documents (full objects with methods)
  // Memory: ~5KB per document

// With .lean() (faster):
const porters = await Porter.find({ isAvailable: true }).lean()
// Returns plain JavaScript objects
// Memory: ~2KB per document
// Speed: ~40% faster

/\*\*

- USE CASE:
- - .lean() for read-only queries (displays, lists)
- - Regular find for updates (need Mongoose methods)
    \*/

/\*\*

- OPTIMIZATION 2: Projection (select specific fields)
  \*/
  // Fetch all fields (wasteful):
  db.porters.find({ isAvailable: true })
  // Returns: name, phone, rating, location, skills, earnings... (all fields)

// Fetch only needed fields (efficient):
db.porters.find(
{ isAvailable: true },
{ name: 1, rating: 1, phone: 1 } // Only these
)
// Returns: only name, rating, phone
// Reduces data transfer by 70%!

/\*\*

- OPTIMIZATION 3: Query execution plan
  \*/
  // Check if query uses index:
  db.porters.find({ station: 'Central Station' }).explain('executionStats')
  // Look for:
  // - "totalDocsExamined": 10 (good, uses index)
  // - "totalDocsExamined": 10000 (bad, full scan)

/\*\*

- FOR VIVA EXPLANATION:
-
- "I optimized query performance using:
-
- 1.  .lean() for read-only queries
- - 40% faster, less memory
-
- 2.  Field projection (only fetch needed fields)
- - 70% less data transfer
-
- 3.  Strategic indexing
- - Binary search O(log n) vs full scan O(n)
-
- 4.  Query monitoring
- - Use .explain() to verify index usage
-
- Result: Sub-50ms response times for geospatial queries!"
  \*/

// ========================================
// 8. TRANSACTIONS (BONUS)
// ========================================

/\*\*

- CONCEPT: Multi-step operations that either all succeed or all fail
-
- SCENARIO: Porter assignment
- Step 1: Update booking status to 'assigned'
- Step 2: Update porter availability to 'false'
-
- WITHOUT TRANSACTION:
- Step 1 succeeds, Step 2 fails -> INCONSISTENT STATE ❌
- (Booking assigned but porter marked available)
-
- WITH TRANSACTION:
- All steps execute together
- Any step fails -> ROLLBACK everything
- All succeed -> COMMIT everything ✓
  \*/

// MongoDB transaction (MongoDB 4.0+):
const session = await mongoose.startSession()
session.startTransaction()

try {
// Step 1: Update booking
await Booking.findByIdAndUpdate(bookingId, { status: 'assigned' }, { session })

// Step 2: Update porter
await Porter.findByIdAndUpdate(porterId, { isAvailable: false }, { session })

// All succeeded - commit
await session.commitTransaction()
} catch (error) {
// Any failed - rollback
await session.abortTransaction()
throw error
} finally {
session.endSession()
}

/\*\*

- FOR VIVA EXPLANATION (if asked about transactions):
-
- "MongoDB 4.0+ supports ACID transactions.
-
- In porter assignment:
- - Update booking (mark as assigned)
- - Update porter (mark unavailable)
-
- These must happen together.
- If one fails and other succeeds -> Inconsistent data
-
- Transaction ensures atomicity:
- All succeed -> commit
- Any fails -> rollback (abort all)"
  \*/

// ========================================
// SUMMARY FOR VIVA
// ========================================

/\*\*

- KEY MONGODB CONCEPTS TO EXPLAIN:
-
- 1.  GEOSPATIAL QUERIES
- - Finding nearest porters using $near
- - Requires 2dsphere index
- - Powers Uber-style proximity search
-
- 2.  AGGREGATION PIPELINES
- - Multi-stage data processing on MongoDB server
- - $geoNear -> $match -> $sort -> $limit
- - Much faster than JavaScript processing
-
- 3.  ARRAY OPERATIONS
- - $push, $addToSet, $pull for dynamic arrays
- - Managing skills and items efficiently
-
- 4.  INDEXING
- - Single field, compound, geospatial, TTL
- - 100x performance improvement with proper indexes
-
- 5.  OPERATORS
- - $gte, $lte, $in, $or, $and for flexible filtering
-
- 6.  REFERENCES & POPULATION
- - Document linking using ObjectId
- - Mongoose .populate() for joined data
-
- 7.  OPTIMIZATION
- - .lean(), projection, query monitoring
-
- Showcase: "This backend demonstrates production-grade MongoDB
- usage through an Uber-style porter booking system!"
  \*/
