require("dotenv").config();
const { MongoClient } = require("mongodb");

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in .env");
    process.exit(1);
  }

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    console.log("Connected to MongoDB (script)");

    const db = client.db("ekoolie");
    const porters = db.collection("porters");

    const count = await porters.countDocuments();
    console.log("\ncountDocuments:", count);

    const sample = await porters.find().limit(5).toArray();
    console.log("\nsample find() (limit 5):");
    sample.forEach((p, i) =>
      console.log(
        i + 1,
        p.name || p._id,
        JSON.stringify({
          isAvailable: p.isAvailable,
          station: p.station,
          rating: p.rating,
        }),
      ),
    );

    const available = await porters.find({ isAvailable: true }).toArray();
    console.log("\nfind({ isAvailable: true }) count:", available.length);

    const near = await porters
      .find({
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [72.8247, 18.9676] },
            $maxDistance: 5000,
          },
        },
      })
      .limit(5)
      .toArray();

    console.log("\n$near results (limit 5):");
    near.forEach((p, i) => console.log(i + 1, p.name || p._id, p.location));

    const agg = await porters
      .aggregate([
        {
          $group: {
            _id: "$station",
            count: { $sum: 1 },
            avgRating: { $avg: "$rating" },
          },
        },
      ])
      .toArray();

    console.log("\naggregation result:");
    console.table(agg);
  } catch (err) {
    console.error("Script error:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
})();
