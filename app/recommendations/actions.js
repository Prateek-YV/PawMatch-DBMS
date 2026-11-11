"use server";

import { redirect } from "next/navigation";
import { requireUser, dbError } from "@/lib/auth";
import { safeMongo } from "@/lib/mongo";
import { buildPreferenceVector, runAndStoreMatches, splitList } from "@/lib/matching";

export async function savePreferences(formData) {
  const user = await requireUser(["adopter"]);
  const species = formData.getAll("species").map(String);
  const sizes = formData.getAll("sizes").map(String);
  if (species.length === 0) redirect("/recommendations?err=" + encodeURIComponent("Choose at least one species"));
  const energy = Number(formData.get("desired_energy") || 3);
  const hasKids = Boolean(formData.get("has_kids"));
  const traits = splitList(formData.get("wanted_traits"));
  const doc = {
    user_id: user.user_id,
    preferred_species: species,
    preferred_sizes: sizes,
    desired_energy: energy,
    has_kids: hasKids,
    has_other_pets: Boolean(formData.get("has_other_pets")),
    housing: String(formData.get("housing") || "house"),
    has_yard: Boolean(formData.get("has_yard")),
    experience_level: String(formData.get("experience_level") || "beginner"),
    wanted_traits: traits,
    preference_vector: buildPreferenceVector({ energy, hasKids, traits }),
    updated_at: new Date(),
  };
  const saved = await safeMongo((db) => db.collection("user_preferences").replaceOne({ user_id: user.user_id }, doc, { upsert: true }), null);
  if (!saved) redirect("/recommendations?err=" + encodeURIComponent("Could not save preferences (MongoDB offline or validation failed)"));
  redirect("/recommendations?msg=" + encodeURIComponent("Preferences saved. Now click Find my matches."));
}

export async function refreshMatches() {
  const user = await requireUser(["adopter"]);
  let result;
  try {
    result = await runAndStoreMatches(user.user_id);
  } catch (e) {
    redirect("/recommendations?err=" + encodeURIComponent(dbError(e)));
  }
  if (!result.ok) redirect("/recommendations?err=" + encodeURIComponent(result.reason));
  redirect("/recommendations?msg=" + encodeURIComponent(`Found ${result.count} matches in MongoDB and saved them to the SQL pet_match table.`));
}
