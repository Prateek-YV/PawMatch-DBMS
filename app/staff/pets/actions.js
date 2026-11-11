"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { requireUser, dbError } from "@/lib/auth";
import { safeMongo } from "@/lib/mongo";
import { buildPetVector, splitList } from "@/lib/matching";

async function assertShelterAccess(user, petId) {
  if (user.role === "admin") return;
  const [rows] = await pool.query("SELECT pet_id FROM pet WHERE pet_id = ? AND shelter_id = ?", [petId, user.shelter_id]);
  if (rows.length === 0) throw new Error("You can only manage pets of your own shelter");
}

export async function addPet(formData) {
  const user = await requireUser(["shelter_staff", "admin"]);
  const shelterId = user.role === "admin" ? String(formData.get("shelter_id")) : user.shelter_id;
  const traits = splitList(formData.get("traits"));
  const energy = Number(formData.get("energy_level") || 3);
  const kidsOk = Boolean(formData.get("kids_ok"));
  let failure = null;
  let newId = null;
  try {
    const [[row]] = await pool.query("SELECT CONCAT('P', LPAD(COALESCE(MAX(CAST(SUBSTRING(pet_id, 2) AS UNSIGNED)), 0) + 1, 3, '0')) AS next_id FROM pet");
    newId = row.next_id;
    await pool.query("INSERT INTO pet (pet_id, name, species, breed, age, gender, temperament, adoption_status, intake_date, shelter_id) VALUES (?, ?, ?, ?, ?, ?, ?, 'available', CURDATE(), ?)", [
      newId,
      String(formData.get("name") || "").trim(),
      String(formData.get("species")),
      String(formData.get("breed") || "").trim() || null,
      Number(formData.get("age") || 0),
      String(formData.get("gender") || "U"),
      String(formData.get("temperament") || "").trim() || null,
      shelterId,
    ]);
    await safeMongo((db) => db.collection("pet_profiles").insertOne({
      pet_id: newId,
      name: String(formData.get("name") || "").trim(),
      species: String(formData.get("species")),
      breed: String(formData.get("breed") || "").trim() || "Mixed",
      age: Number(formData.get("age") || 0),
      size: String(formData.get("size") || "medium"),
      adoption_status: "available",
      energy_level: energy,
      traits,
      good_with: { kids: kidsOk, dogs: Boolean(formData.get("dogs_ok")), cats: Boolean(formData.get("cats_ok")) },
      needs: { yard_required: Boolean(formData.get("needs_yard")), experienced_owner: Boolean(formData.get("needs_experience")) },
      description: String(formData.get("temperament") || "").trim() || "New arrival",
      feature_vector: buildPetVector({ energy, traits, kidsOk }),
      updated_at: new Date(),
    }));
  } catch (e) {
    failure = dbError(e);
  }
  if (failure) redirect("/staff/pets?err=" + encodeURIComponent(failure));
  redirect("/staff/pets?msg=" + encodeURIComponent(`Pet ${newId} added (SQL row and MongoDB profile).`));
}

export async function updatePet(formData) {
  const user = await requireUser(["shelter_staff", "admin"]);
  const petId = String(formData.get("pet_id"));
  let failure = null;
  try {
    await assertShelterAccess(user, petId);
    await pool.query("UPDATE pet SET name = ?, species = ?, breed = ?, age = ?, gender = ?, temperament = ?, adoption_status = ? WHERE pet_id = ?", [
      String(formData.get("name") || "").trim(),
      String(formData.get("species")),
      String(formData.get("breed") || "").trim() || null,
      Number(formData.get("age") || 0),
      String(formData.get("gender") || "U"),
      String(formData.get("temperament") || "").trim() || null,
      String(formData.get("adoption_status")),
      petId,
    ]);
    await safeMongo((db) => db.collection("pet_profiles").updateOne({ pet_id: petId }, { $set: { name: String(formData.get("name") || "").trim(), adoption_status: String(formData.get("adoption_status")), updated_at: new Date() } }));
  } catch (e) {
    failure = dbError(e);
  }
  if (failure) redirect(`/staff/pets/${petId}?err=` + encodeURIComponent(failure));
  redirect(`/staff/pets/${petId}?msg=` + encodeURIComponent("Pet updated."));
}

export async function addMedicalRecord(formData) {
  const user = await requireUser(["shelter_staff", "admin"]);
  const petId = String(formData.get("pet_id"));
  let failure = null;
  try {
    await assertShelterAccess(user, petId);
    const [[row]] = await pool.query("SELECT COALESCE(MAX(record_no), 0) + 1 AS next_no FROM medical_record WHERE pet_id = ?", [petId]);
    await pool.query("INSERT INTO medical_record (pet_id, record_no, checkup_date, vaccination_status, diagnosis) VALUES (?, ?, ?, ?, ?)", [
      petId, row.next_no, String(formData.get("checkup_date")), String(formData.get("vaccination_status")), String(formData.get("diagnosis") || "").trim() || null,
    ]);
  } catch (e) {
    failure = dbError(e);
  }
  if (failure) redirect(`/staff/pets/${petId}?err=` + encodeURIComponent(failure));
  redirect(`/staff/pets/${petId}?msg=` + encodeURIComponent("Medical record added."));
}

export async function deleteMedicalRecord(formData) {
  const user = await requireUser(["shelter_staff", "admin"]);
  const petId = String(formData.get("pet_id"));
  let failure = null;
  try {
    await assertShelterAccess(user, petId);
    await pool.query("DELETE FROM medical_record WHERE pet_id = ? AND record_no = ?", [petId, Number(formData.get("record_no"))]);
  } catch (e) {
    failure = dbError(e);
  }
  if (failure) redirect(`/staff/pets/${petId}?err=` + encodeURIComponent(failure));
  redirect(`/staff/pets/${petId}?msg=` + encodeURIComponent("Medical record deleted."));
}

export async function addImage(formData) {
  const user = await requireUser(["shelter_staff", "admin"]);
  const petId = String(formData.get("pet_id"));
  let failure = null;
  try {
    await assertShelterAccess(user, petId);
    const [[row]] = await pool.query("SELECT COALESCE(MAX(image_no), 0) + 1 AS next_no FROM pet_image WHERE pet_id = ?", [petId]);
    await pool.query("INSERT INTO pet_image (pet_id, image_no, image_url, uploaded_date) VALUES (?, ?, ?, CURDATE())", [petId, row.next_no, String(formData.get("image_url")).trim()]);
  } catch (e) {
    failure = e.code === "ER_DUP_ENTRY" ? "That image URL is already used" : dbError(e);
  }
  if (failure) redirect(`/staff/pets/${petId}?err=` + encodeURIComponent(failure));
  redirect(`/staff/pets/${petId}?msg=` + encodeURIComponent("Image added."));
}

export async function deletePet(formData) {
  const user = await requireUser(["shelter_staff", "admin"]);
  const petId = String(formData.get("pet_id"));
  let failure = null;
  try {
    await assertShelterAccess(user, petId);
    await pool.query("DELETE FROM pet WHERE pet_id = ?", [petId]);
    await safeMongo((db) => db.collection("pet_profiles").deleteOne({ pet_id: petId }));
  } catch (e) {
    failure = dbError(e);
  }
  if (failure) redirect(`/staff/pets/${petId}?err=` + encodeURIComponent(failure));
  redirect("/staff/pets?msg=" + encodeURIComponent(`Pet ${petId} deleted. Its medical records, images, applications and matches were removed by ON DELETE CASCADE.`));
}
