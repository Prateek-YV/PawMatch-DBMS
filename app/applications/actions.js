"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { requireUser, dbError } from "@/lib/auth";

export async function approveApplication(formData) {
  const user = await requireUser(["shelter_staff", "admin"]);
  const id = String(formData.get("application_id"));
  let failure = null;
  try {
    await pool.query("CALL sp_approve_application(?, ?)", [id, user.user_id]);
  } catch (e) {
    failure = dbError(e);
  }
  if (failure) redirect("/applications?err=" + encodeURIComponent(failure));
  redirect("/applications?msg=" + encodeURIComponent(`Application ${id} approved. Competing applications were rejected automatically.`));
}

export async function rejectApplication(formData) {
  const user = await requireUser(["shelter_staff", "admin"]);
  const id = String(formData.get("application_id"));
  let failure = null;
  try {
    await pool.query("CALL sp_reject_application(?, ?)", [id, user.user_id]);
  } catch (e) {
    failure = dbError(e);
  }
  if (failure) redirect("/applications?err=" + encodeURIComponent(failure));
  redirect("/applications?msg=" + encodeURIComponent(`Application ${id} rejected.`));
}

export async function withdrawApplication(formData) {
  const user = await requireUser(["adopter"]);
  const id = String(formData.get("application_id"));
  let failure = null;
  try {
    await pool.query("CALL sp_withdraw_application(?, ?)", [id, user.user_id]);
  } catch (e) {
    failure = dbError(e);
  }
  if (failure) redirect("/applications?err=" + encodeURIComponent(failure));
  redirect("/applications?msg=" + encodeURIComponent(`Application ${id} withdrawn.`));
}
