db = db.getSiblingDB("pawmatch_nosql");

print("\n=== Q1. Available dogs ===");
printjson(db.pet_profiles.find({ species: "Dog", adoption_status: "available" }, { _id: 0, pet_id: 1, name: 1, breed: 1, age: 1 }).toArray());

print("\n=== Q2. Pets that are calm (array field) ===");
printjson(db.pet_profiles.find({ traits: "calm" }, { _id: 0, pet_id: 1, name: 1, traits: 1 }).toArray());

print("\n=== Q3. Available pets good with kids that do not need an experienced owner (nested fields) ===");
printjson(db.pet_profiles.find({ adoption_status: "available", "good_with.kids": true, "needs.experienced_owner": false }, { _id: 0, pet_id: 1, name: 1, species: 1 }).toArray());

print("\n=== Q4. Energy level 4 or 5, sorted by energy (comparison operators) ===");
printjson(db.pet_profiles.find({ energy_level: { $gte: 4 }, adoption_status: "available" }, { _id: 0, pet_id: 1, name: 1, energy_level: 1 }).sort({ energy_level: -1, name: 1 }).toArray());

print("\n=== Q5. Text search: gentle quiet ===");
printjson(db.pet_profiles.find({ $text: { $search: "gentle quiet" } }, { _id: 0, pet_id: 1, name: 1, score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } }).toArray());

print("\n=== Q6. Pets per species and status (aggregation: group) ===");
printjson(db.pet_profiles.aggregate([
  { $group: { _id: { species: "$species", status: "$adoption_status" }, total: { $sum: 1 } } },
  { $sort: { "_id.species": 1, total: -1 } }
]).toArray());

print("\n=== Q7. Most favourited pets (aggregation: match, group, lookup) ===");
printjson(db.user_activity.aggregate([
  { $match: { action: "favorite" } },
  { $group: { _id: "$pet_id", favourites: { $sum: 1 } } },
  { $sort: { favourites: -1, _id: 1 } },
  { $limit: 5 },
  { $lookup: { from: "pet_profiles", localField: "_id", foreignField: "pet_id", as: "pet" } },
  { $unwind: "$pet" },
  { $project: { _id: 0, pet_id: "$_id", name: "$pet.name", species: "$pet.species", favourites: 1 } }
]).toArray());

print("\n=== Q8. Activity count per user per action ===");
printjson(db.user_activity.aggregate([
  { $group: { _id: { user_id: "$user_id", action: "$action" }, total: { $sum: 1 } } },
  { $sort: { "_id.user_id": 1, "_id.action": 1 } }
]).toArray());

function findMatches(userId, limit) {
  const u = db.user_preferences.findOne({ user_id: userId });
  if (!u) { return []; }
  const magUser = Math.sqrt(u.preference_vector.reduce(function (s, x) { return s + x * x; }, 0));
  const filter = { adoption_status: "available", species: { $in: u.preferred_species } };
  if (u.preferred_sizes && u.preferred_sizes.length > 0) { filter.size = { $in: u.preferred_sizes }; }
  if (u.has_kids) { filter["good_with.kids"] = true; }
  if (u.has_other_pets) { filter["good_with.dogs"] = true; }
  if (!u.has_yard) { filter["needs.yard_required"] = false; }
  if (u.experience_level === "beginner") { filter["needs.experienced_owner"] = false; }
  return db.pet_profiles.aggregate([
    { $match: filter },
    { $addFields: {
        dot: { $reduce: { input: { $zip: { inputs: ["$feature_vector", u.preference_vector] } }, initialValue: 0, in: { $add: ["$$value", { $multiply: [{ $arrayElemAt: ["$$this", 0] }, { $arrayElemAt: ["$$this", 1] }] }] } } },
        magPet: { $sqrt: { $reduce: { input: "$feature_vector", initialValue: 0, in: { $add: ["$$value", { $multiply: ["$$this", "$$this"] }] } } } },
        sharedTraits: { $size: { $setIntersection: ["$traits", u.wanted_traits] } }
    } },
    { $addFields: { cosine: { $divide: ["$dot", { $multiply: ["$magPet", magUser] }] } } },
    { $addFields: { match_score: { $round: [{ $min: [100, { $add: [{ $multiply: ["$cosine", 85] }, { $multiply: ["$sharedTraits", 5] }] }] }, 2] } } },
    { $sort: { match_score: -1, pet_id: 1 } },
    { $limit: limit },
    { $project: { _id: 0, pet_id: 1, name: 1, species: 1, breed: 1, sharedTraits: 1, match_score: 1 } }
  ]).toArray();
}

print("\n=== Q9. Top 3 matches for every adopter (vector similarity + trait overlap) ===");
let counter = 100;
const sqlCalls = [];
db.user_preferences.find({}, { _id: 0, user_id: 1 }).sort({ user_id: 1 }).toArray().forEach(function (p) {
  print("\nMatches for " + p.user_id + ":");
  const results = findMatches(p.user_id, 3);
  printjson(results);
  results.forEach(function (r) {
    counter += 1;
    sqlCalls.push("CALL sp_upsert_pet_match('M" + counter + "', '" + p.user_id + "', '" + r.pet_id + "', " + r.match_score.toFixed(2) + ");");
  });
});

print("\n=== Q10. MySQL statements that copy these scores into the SQL pet_match table ===");
sqlCalls.forEach(function (c) { print(c); });

print("\n=== Q11. Updates (re-runnable; the insert adds one more activity row each run) ===");
printjson(db.pet_profiles.updateOne({ pet_id: "P002" }, { $addToSet: { traits: "indoor-only" }, $set: { updated_at: new Date() } }));
printjson(db.pet_profiles.updateMany({ pet_id: { $in: ["P003", "P009"] } }, { $set: { adoption_status: "pending" } }));
printjson(db.user_activity.insertOne({ user_id: "U006", pet_id: "P006", action: "view", ts: new Date(), meta: { device: "mobile", seconds_on_page: 30 } }));
