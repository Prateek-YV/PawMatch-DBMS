import { pool } from "@/lib/db";
import { safeMongo } from "@/lib/mongo";

const clamp = (x) => Math.max(0, Math.min(1, Math.round(x * 100) / 100));

export function buildPetVector({ energy, traits, kidsOk }) {
  const t = traits.map((x) => x.toLowerCase());
  const e = energy / 5;
  return [
    clamp(e),
    clamp(0.65 + (t.includes("friendly") || t.includes("affectionate") ? 0.25 : 0)),
    clamp(1 - e + (t.includes("calm") || t.includes("quiet") ? 0.1 : 0)),
    clamp(kidsOk ? 0.85 : 0.3),
    clamp(t.includes("independent") ? 0.9 : 0.35),
  ];
}

export function buildPreferenceVector({ energy, hasKids, traits }) {
  const t = traits.map((x) => x.toLowerCase());
  const e = energy / 5;
  return [
    clamp(e),
    clamp(0.75 + (t.includes("friendly") || t.includes("affectionate") ? 0.15 : 0)),
    clamp(1 - e + (t.includes("calm") || t.includes("quiet") ? 0.1 : 0)),
    clamp(hasKids ? 0.9 : 0.5),
    clamp(t.includes("independent") ? 0.8 : 0.35),
  ];
}

export function splitList(text) {
  return String(text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function findMatchesInMongo(userId, limit) {
  return safeMongo(async (db) => {
    const u = await db.collection("user_preferences").findOne({ user_id: userId });
    if (!u) return [];
    const magUser = Math.sqrt(u.preference_vector.reduce((s, x) => s + x * x, 0));
    const filter = { adoption_status: "available", species: { $in: u.preferred_species } };
    if (u.preferred_sizes && u.preferred_sizes.length > 0) filter.size = { $in: u.preferred_sizes };
    if (u.has_kids) filter["good_with.kids"] = true;
    if (u.has_other_pets) filter["good_with.dogs"] = true;
    if (!u.has_yard) filter["needs.yard_required"] = false;
    if (u.experience_level === "beginner") filter["needs.experienced_owner"] = false;
    return db
      .collection("pet_profiles")
      .aggregate([
        { $match: filter },
        {
          $addFields: {
            dot: {
              $reduce: {
                input: { $zip: { inputs: ["$feature_vector", u.preference_vector] } },
                initialValue: 0,
                in: { $add: ["$$value", { $multiply: [{ $arrayElemAt: ["$$this", 0] }, { $arrayElemAt: ["$$this", 1] }] }] },
              },
            },
            magPet: { $sqrt: { $reduce: { input: "$feature_vector", initialValue: 0, in: { $add: ["$$value", { $multiply: ["$$this", "$$this"] }] } } } },
            sharedTraits: { $size: { $setIntersection: ["$traits", u.wanted_traits || []] } },
          },
        },
        { $addFields: { cosine: { $divide: ["$dot", { $multiply: ["$magPet", magUser] }] } } },
        { $addFields: { match_score: { $round: [{ $min: [100, { $add: [{ $multiply: ["$cosine", 85] }, { $multiply: ["$sharedTraits", 5] }] }] }, 2] } } },
        { $sort: { match_score: -1, pet_id: 1 } },
        { $limit: limit },
        { $project: { _id: 0, pet_id: 1, name: 1, match_score: 1, sharedTraits: 1 } },
      ])
      .toArray();
  }, null);
}

export async function runAndStoreMatches(userId) {
  const found = await findMatchesInMongo(userId, 15);
  if (found === null) return { ok: false, reason: "MongoDB is not reachable" };
  if (found.length === 0) return { ok: false, reason: "No matches found. Save your preferences first, or relax them." };
  const ids = found.map((f) => f.pet_id);
  const [stillAvailable] = await pool.query("SELECT pet_id FROM pet WHERE pet_id IN (?) AND adoption_status = 'available'", [ids]);
  const okIds = new Set(stillAvailable.map((r) => r.pet_id));
  const top = found.filter((f) => okIds.has(f.pet_id)).slice(0, 5);
  for (const m of top) {
    const [[row]] = await pool.query("SELECT CONCAT('M', LPAD(COALESCE(MAX(CAST(SUBSTRING(match_id, 2) AS UNSIGNED)), 0) + 1, 3, '0')) AS next_id FROM pet_match");
    await pool.query("CALL sp_upsert_pet_match(?, ?, ?, ?)", [row.next_id, userId, m.pet_id, m.match_score]);
  }
  return { ok: true, count: top.length };
}
