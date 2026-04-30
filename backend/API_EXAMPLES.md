/\*\*

- ========================================
- API REQUEST BODY EXAMPLES
- ========================================
-
- Copy and paste these examples to test the API
- Use Postman, cURL, or any HTTP client
  \*/

// ========================================
// PORTER ENDPOINTS
// ========================================

/\*\*

- 1.  ADD NEW PORTER
- POST /api/porters
  \*/
  {
  "name": "Rajesh Kumar",
  "phone": "9876543210",
  "station": "Central Station",
  "maxLoad": 80,
  "location": {
  "type": "Point",
  "coordinates": [72.8247, 18.9676]
  },
  "skills": ["heavy luggage", "VIP service", "express service"]
  }

/\*\*

- 2.  ADD SKILL TO PORTER
- POST /api/porters/:id/skills
  \*/
  {
  "skill": "wheelchair assist"
  }

/\*\*

- 3.  REMOVE SKILL FROM PORTER
- DELETE /api/porters/:id/skills
  \*/
  {
  "skill": "old skill"
  }

/\*\*

- 4.  UPDATE PORTER AVAILABILITY
- PATCH /api/porters/:id/availability
  \*/
  {
  "isAvailable": false
  }

/\*\*

- 5.  UPDATE PORTER STATS
- PATCH /api/porters/:id/stats
  \*/
  {
  "rating": 4.8,
  "earnings": 500
  }

// ========================================
// BOOKING ENDPOINTS
// ========================================

/\*\*

- 1.  CREATE BOOKING
- POST /api/bookings
  \*/
  {
  "userId": "user_001",
  "userPhone": "9999999999",
  "station": "Central Station",
  "location": {
  "type": "Point",
  "coordinates": [72.8247, 18.9676]
  },
  "items": [
  {
  "name": "Large Suitcase",
  "weight": 25,
  "description": "Blue suitcase"
  },
  {
  "name": "Backpack",
  "weight": 8,
  "description": "Travel backpack"
  }
  ],
  "specialRequests": "Be careful with suitcase, contains fragile items"
  }

/\*\*

- 2.  ADD ITEM TO BOOKING
- POST /api/bookings/:bookingId/items
  \*/
  {
  "name": "Additional Suitcase",
  "weight": 20,
  "description": "Red suitcase with wheels"
  }

/\*\*

- 3.  UPDATE BOOKING STATUS
- PATCH /api/bookings/:bookingId/status
  \*/
  {
  "status": "in_progress"
  }

// Valid statuses: pending, assigned, in_progress, completed, cancelled

// ========================================
// QUERY PARAMETERS (GET REQUESTS)
// ========================================

/\*\*

- GET /api/porters - Get all porters
-
- Query parameters:
- - station: string (e.g., "Central Station")
- - isAvailable: boolean (e.g., "true" or "false")
- - minRating: number (e.g., 4.5)
-
- Examples:
  \*/
  GET /api/porters
  GET /api/porters?station=Central%20Station
  GET /api/porters?isAvailable=true
  GET /api/porters?minRating=4.5
  GET /api/porters?station=Central%20Station&isAvailable=true&minRating=4.5

/\*\*

- GET /api/porters/filter/by-skill - Get porters by skill
-
- Query parameters:
- - skills: comma-separated string (e.g., "heavy luggage,VIP service")
-
- Examples:
  \*/
  GET /api/porters/filter/by-skill?skills=heavy%20luggage
  GET /api/porters/filter/by-skill?skills=heavy%20luggage,VIP%20service
  GET /api/porters/filter/by-skill?skills=wheelchair%20assist,express%20service

/\*\*

- GET /api/bookings - Get all bookings
-
- Query parameters:
- - station: string
- - status: string (pending, assigned, in_progress, completed, cancelled)
- - userId: string
- - minWeight: number (in kg)
- - maxWeight: number (in kg)
- - assignedPorter: ObjectId
-
- Examples:
  \*/
  GET /api/bookings
  GET /api/bookings?status=pending
  GET /api/bookings?userId=user_001
  GET /api/bookings?station=Central%20Station&status=completed
  GET /api/bookings?minWeight=10&maxWeight=50
  GET /api/bookings?station=Central%20Station&status=pending&minWeight=20

/\*\*

- GET /api/bookings/nearest-porters - Find nearest porters (GEOSPATIAL)
-
- Query parameters (REQUIRED):
- - longitude: number
- - latitude: number
-
- Optional:
- - maxDistance: number in meters (default: 5000)
- - station: string
- - minCapacity: number (in kg)
- - skill: string (e.g., "heavy luggage")
- - limit: number (default: 5)
-
- Examples:
  \*/
  GET /api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676
  GET /api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676&maxDistance=3000
  GET /api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676&station=Central%20Station
  GET /api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676&minCapacity=30
  GET /api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676&skill=heavy%20luggage
  GET /api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676&limit=10

/\*\*

- POST /api/bookings/:bookingId/assign-best-porter - Assign best porter
-
- No body required - uses booking location to find best porter via aggregation pipeline
-
- Example:
  \*/
  POST /api/bookings/507f1f77bcf86cd799439011/assign-best-porter

// ========================================
// STATION COORDINATES (Common Locations)
// ========================================

// Mumbai Central Station
{
"longitude": 72.8247,
"latitude": 18.9676
}

// Dadar Station
{
"longitude": 72.8272,
"latitude": 19.0176
}

// Bandra Station
{
"longitude": 72.8346,
"latitude": 19.0596
}

// Thane Station
{
"longitude": 72.9789,
"latitude": 19.2183
}

// Borivali Station
{
"longitude": 72.8511,
"latitude": 19.2297
}

// ========================================
// cURL EXAMPLES
// ========================================

/\*\*

- 1.  GET ALL PORTERS
      \*/
      curl http://localhost:5000/api/porters

/\*\*

- 2.  GET AVAILABLE PORTERS IN CENTRAL STATION
      \*/
      curl "http://localhost:5000/api/porters?station=Central%20Station&isAvailable=true"

/\*\*

- 3.  GET HIGH-RATED PORTERS
      \*/
      curl "http://localhost:5000/api/porters?minRating=4.5"

/\*\*

- 4.  CREATE NEW PORTER
      \*/
      curl -X POST http://localhost:5000/api/porters \
       -H "Content-Type: application/json" \
       -d '{
      "name": "New Porter",
      "phone": "9999999999",
      "station": "Central Station",
      "maxLoad": 80,
      "location": {
      "type": "Point",
      "coordinates": [72.8247, 18.9676]
      },
      "skills": ["heavy luggage"]
      }'

/\*\*

- 5.  ADD SKILL TO PORTER
      \*/
      curl -X POST http://localhost:5000/api/porters/PORTER_ID/skills \
       -H "Content-Type: application/json" \
       -d '{"skill": "wheelchair assist"}'

/\*\*

- 6.  CREATE BOOKING
      \*/
      curl -X POST http://localhost:5000/api/bookings \
       -H "Content-Type: application/json" \
       -d '{
      "userId": "user_001",
      "userPhone": "9999999999",
      "station": "Central Station",
      "location": {
      "type": "Point",
      "coordinates": [72.8247, 18.9676]
      },
      "items": [
      {"name": "Suitcase", "weight": 25}
      ],
      "specialRequests": "Quick service"
      }'

/\*\*

- 7.  FIND NEAREST PORTERS (Geospatial Query)
      \*/
      curl "http://localhost:5000/api/bookings/nearest-porters?longitude=72.8247&latitude=18.9676&limit=5"

/\*\*

- 8.  ASSIGN BEST PORTER (Aggregation Pipeline)
      \*/
      curl -X POST http://localhost:5000/api/bookings/BOOKING_ID/assign-best-porter

/\*\*

- 9.  GET ALL BOOKINGS
      \*/
      curl http://localhost:5000/api/bookings

/\*\*

- 10. GET PENDING BOOKINGS
      \*/
      curl "http://localhost:5000/api/bookings?status=pending"

/\*\*

- 11. UPDATE BOOKING STATUS
      \*/
      curl -X PATCH http://localhost:5000/api/bookings/BOOKING_ID/status \
       -H "Content-Type: application/json" \
       -d '{"status": "in_progress"}'

/\*\*

- 12. ADD ITEM TO BOOKING
      \*/
      curl -X POST http://localhost:5000/api/bookings/BOOKING_ID/items \
       -H "Content-Type: application/json" \
       -d '{
      "name": "Additional Bag",
      "weight": 10,
      "description": "Small bag"
      }'

/\*\*

- 13. HEALTH CHECK
      \*/
      curl http://localhost:5000/api/health

/\*\*

- 14. API DOCUMENTATION
      \*/
      curl http://localhost:5000/api
