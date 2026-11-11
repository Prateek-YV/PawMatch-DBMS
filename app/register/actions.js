"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { dbError } from "@/lib/auth";

export async function register(formData) {
  const first = String(formData.get("first_name") || "").trim();
  const last = String(formData.get("last_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const phone = String(formData.get("phone") || "").trim();
  const role = String(formData.get("role") || "adopter");

  if (!first || !last || !email) redirect("/register?err=" + encodeURIComponent("Name and email are required"));
  if (password.length < 8) redirect("/register?err=" + encodeURIComponent("Password must be at least 8 characters"));
  if (!["adopter", "foster"].includes(role)) redirect("/register?err=" + encodeURIComponent("Invalid role"));

  const hash = await bcrypt.hash(password, 10);
  const conn = await pool.getConnection();
  let failure = null;
  try {
    await conn.beginTransaction();
    const [[row]] = await conn.query("SELECT CONCAT('U', LPAD(COALESCE(MAX(CAST(SUBSTRING(user_id, 2) AS UNSIGNED)), 0) + 1, 3, '0')) AS next_id FROM users FOR UPDATE");
    const userId = row.next_id;
    await conn.query("INSERT INTO users (user_id, first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)", [userId, first, last, email, hash, role]);
    if (phone) {
      await conn.query("INSERT INTO user_phone (user_id, phone_no) VALUES (?, ?)", [userId, phone]);
    }
    if (role === "adopter") {
      await conn.query("INSERT INTO adopter_profile (user_id, housing_type, has_yard, household_size) VALUES (?, ?, ?, ?)", [
        userId,
        String(formData.get("housing_type") || "house"),
        formData.get("has_yard") ? "Y" : "N",
        Number(formData.get("household_size") || 1),
      ]);
    } else {
      await conn.query("INSERT INTO foster_profile (user_id, max_capacity, experience_years, availability_status) VALUES (?, ?, ?, 'available')", [
        userId,
        Number(formData.get("max_capacity") || 1),
        Number(formData.get("experience_years") || 0),
      ]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    failure = e.code === "ER_DUP_ENTRY" ? "That email or phone is already registered" : dbError(e);
  } finally {
    conn.release();
  }
  if (failure) redirect("/register?err=" + encodeURIComponent(failure));
  redirect("/login?msg=" + encodeURIComponent("Account created. You can log in now."));
}
