"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { requireUser, dbError } from "@/lib/auth";

export async function completeFoster(formData) {
  const user = await requireUser(["foster", "shelter_staff", "admin"]);
  const id = String(formData.get("foster_id"));
  let failure = null;
  try {
    if (user.role === "foster") {
      const [rows] = await pool.query("SELECT foster_id FROM foster_assignment WHERE foster_id = ? AND user_id = ?", [id, user.user_id]);
      if (rows.length === 0) throw new Error("You can only complete your own placements");
    }
    await pool.query("CALL sp_complete_foster(?, CURDATE())", [id]);
  } catch (e) {
    failure = dbError(e);
  }
  if (failure) redirect("/fosters?err=" + encodeURIComponent(failure));
  redirect("/fosters?msg=" + encodeURIComponent(`Placement ${id} completed. The pet is available again.`));
}

export async function placeFoster(formData) {
  await requireUser(["shelter_staff", "admin"]);
  const petId = String(formData.get("pet_id"));
  const caregiver = String(formData.get("user_id"));
  let failure = null;
  try {
    const [[row]] = await pool.query("SELECT CONCAT('F', LPAD(COALESCE(MAX(CAST(SUBSTRING(foster_id, 2) AS UNSIGNED)), 0) + 1, 3, '0')) AS next_id FROM foster_assignment");
    await pool.query("CALL sp_place_foster(?, ?, ?, CURDATE())", [row.next_id, caregiver, petId]);
  } catch (e) {
    failure = dbError(e);
  }
  if (failure) redirect("/fosters?err=" + encodeURIComponent(failure));
  redirect("/fosters?msg=" + encodeURIComponent("Foster placement created."));
}
