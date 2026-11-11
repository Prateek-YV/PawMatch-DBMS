"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { requireUser, dbError } from "@/lib/auth";

export async function updateUserRole(formData) {
  const admin = await requireUser(["admin"]);
  const uid = String(formData.get("user_id"));
  const role = String(formData.get("role"));
  const shelter = String(formData.get("shelter_id") || "") || null;
  let failure = null;
  try {
    if (uid === admin.user_id) throw new Error("You cannot change your own role");
    if (role === "shelter_staff" && !shelter) throw new Error("Shelter staff must belong to a shelter");
    await pool.query("UPDATE users SET role = ?, shelter_id = ? WHERE user_id = ?", [role, role === "shelter_staff" ? shelter : null, uid]);
  } catch (e) {
    failure = dbError(e);
  }
  if (failure) redirect("/admin/users?err=" + encodeURIComponent(failure));
  redirect("/admin/users?msg=" + encodeURIComponent(`User ${uid} updated.`));
}

export async function deleteUser(formData) {
  const admin = await requireUser(["admin"]);
  const uid = String(formData.get("user_id"));
  let failure = null;
  try {
    if (uid === admin.user_id) throw new Error("You cannot delete your own account");
    await pool.query("DELETE FROM users WHERE user_id = ?", [uid]);
  } catch (e) {
    failure = dbError(e);
  }
  if (failure) redirect("/admin/users?err=" + encodeURIComponent(failure));
  redirect("/admin/users?msg=" + encodeURIComponent(`User ${uid} deleted (profiles, phones, applications and matches cascade).`));
}

export async function addShelter(formData) {
  await requireUser(["admin"]);
  let failure = null;
  try {
    const [[row]] = await pool.query("SELECT CONCAT('S', LPAD(COALESCE(MAX(CAST(SUBSTRING(shelter_id, 2) AS UNSIGNED)), 0) + 1, 3, '0')) AS next_id FROM shelter");
    await pool.query("INSERT INTO shelter (shelter_id, shelter_name, city, phone_no, email) VALUES (?, ?, ?, ?, ?)", [
      row.next_id, String(formData.get("shelter_name")).trim(), String(formData.get("city")).trim(), String(formData.get("phone_no")).trim(), String(formData.get("email")).trim().toLowerCase(),
    ]);
  } catch (e) {
    failure = e.code === "ER_DUP_ENTRY" ? "A shelter with that email already exists" : dbError(e);
  }
  if (failure) redirect("/admin/users?err=" + encodeURIComponent(failure));
  redirect("/admin/users?msg=" + encodeURIComponent("Shelter added."));
}
