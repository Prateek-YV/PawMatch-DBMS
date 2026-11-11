"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/lib/session";

export async function logout() {
  await destroySession();
  redirect("/login?msg=" + encodeURIComponent("You have been logged out"));
}
