use("ekoolie");
// db.porters.aggregate([
//   {
//     $geoNear: {
//       near: { type: "Point", coordinates: [77.209,28.6139] },
//       distanceField: "distance",
//       maxDistance: 10000,
//       spherical: true,
//       key: "location",
//       query: {
//         isAvailable: true,
//         station: "New Delhi Station",
//       },
//     },
//   },
//   {
//     $match: {
//       maxLoad: { $gte: 30 },
//       rating: { $gte: 4.0 },
//     },
//   },
//   { $sort: { rating: -1 } },
//   { $limit: 3 }
// ]);

// db.porters.aggregate([{
//   $geoNear:{
//     near:{
//       type:"Point",
//       coordinates:[77.209,28.6139]
//     },
//     key:"location",
//     spherical:true,
//     distanceField:"distance",
//     maxDistance:5000,
//   }},
//   {$match:{isAvailable:true}}
// ]);

// db.porters.aggregate([
//   {$geoNear:{
//     near:{
//       type:"Point",
//       coordinates:[77.209,28.6139]
//     },
//     maxDistance:5000,
//     key:"location",
//     distanceField:"distance",
//   }},
//   {$match:{isAvailable:true,
//     ratinfg:{$gte:4.0},
//   }}
// ]);

db.porters.getIndexes();
