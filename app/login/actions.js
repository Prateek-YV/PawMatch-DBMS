"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function login(formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) redirect("/login?err=" + encodeURIComponent("Enter your email and password"));

  const [rows] = await pool.query("SELECT user_id, password_hash FROM users WHERE email = ?", [email]);
  const ok = rows.length === 1 && (await bcrypt.compare(password, rows[0].password_hash));
  if (!ok) redirect("/login?err=" + encodeURIComponent("Invalid email or password"));

  await createSession(rows[0].user_id);
  redirect("/");
}
