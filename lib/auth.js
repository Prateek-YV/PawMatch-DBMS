import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { readSession } from "@/lib/session";

export async function getUser() {
  const uid = await readSession();
  if (!uid) return null;
  const [rows] = await pool.query(
    "SELECT user_id, first_name, last_name, email, role, shelter_id FROM users WHERE user_id = ?",
    [uid]
  );
  return rows[0] || null;
}

export async function requireUser(roles) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/?err=" + encodeURIComponent("You do not have access to that page"));
  return user;
}

export function dbError(e) {
  return e && (e.sqlMessage || e.message) ? String(e.sqlMessage || e.message) : "Something went wrong";
}
