"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { requireUser, dbError } from "@/lib/auth";
import { safeMongo } from "@/lib/mongo";

export async function applyForPet(formData) {
  const user = await requireUser(["adopter"]);
  const petId = String(formData.get("pet_id"));
  let failure = null;
  try {
    const [[row]] = await pool.query("SELECT CONCAT('A', LPAD(COALESCE(MAX(CAST(SUBSTRING(application_id, 2) AS UNSIGNED)), 0) + 1, 3, '0')) AS next_id FROM adoption_application");
    await pool.query("INSERT INTO adoption_application (application_id, application_date, status, decision_date, user_id, pet_id, reviewed_by) VALUES (?, CURDATE(), 'pending', NULL, ?, ?, NULL)", [row.next_id, user.user_id, petId]);
    await safeMongo((db) => db.collection("user_activity").insertOne({ user_id: user.user_id, pet_id: petId, action: "apply", ts: new Date(), meta: { application_id: row.next_id } }));
  } catch (e) {
    failure = dbError(e);
  }
  if (failure) redirect(`/pets/${petId}?err=` + encodeURIComponent(failure));
  redirect(`/pets/${petId}?msg=` + encodeURIComponent("Application submitted. A shelter staff member will review it."));
}

export async function fosterPet(formData) {
  const user = await requireUser(["foster"]);
  const petId = String(formData.get("pet_id"));
  let failure = null;
  try {
    const [[row]] = await pool.query("SELECT CONCAT('F', LPAD(COALESCE(MAX(CAST(SUBSTRING(foster_id, 2) AS UNSIGNED)), 0) + 1, 3, '0')) AS next_id FROM foster_assignment");
    await pool.query("CALL sp_place_foster(?, ?, ?, CURDATE())", [row.next_id, user.user_id, petId]);
  } catch (e) {
    failure = dbError(e);
  }
  if (failure) redirect(`/pets/${petId}?err=` + encodeURIComponent(failure));
  redirect(`/pets/${petId}?msg=` + encodeURIComponent("Foster placement created. Thank you!"));
}

export async function favoritePet(formData) {
  const user = await requireUser(["adopter"]);
  const petId = String(formData.get("pet_id"));
  const saved = await safeMongo((db) => db.collection("user_activity").insertOne({ user_id: user.user_id, pet_id: petId, action: "favorite", ts: new Date(), meta: { device: "web" } }), null);
  if (!saved) redirect(`/pets/${petId}?err=` + encodeURIComponent("Could not save favourite (MongoDB offline)"));
  redirect(`/pets/${petId}?msg=` + encodeURIComponent("Added to your favourites. This improves your future matches."));
}
