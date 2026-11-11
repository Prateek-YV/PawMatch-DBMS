import Link from "next/link";
import { getUser } from "@/lib/auth";
import { logout } from "@/app/actions";

export default async function Nav() {
  const user = await getUser();
  return (
    <nav className="nav">
      <Link href="/" className="brand">🐾 PawMatch</Link>
      <Link href="/pets">Browse pets</Link>
      {user && user.role === "adopter" ? <Link href="/recommendations">My matches</Link> : null}
      {user && (user.role === "adopter" || user.role === "shelter_staff" || user.role === "admin") ? <Link href="/applications">Applications</Link> : null}
      {user && (user.role === "foster" || user.role === "shelter_staff" || user.role === "admin") ? <Link href="/fosters">Foster care</Link> : null}
      {user && (user.role === "shelter_staff" || user.role === "admin") ? <Link href="/staff/pets">Manage pets</Link> : null}
      {user && (user.role === "shelter_staff" || user.role === "admin") ? <Link href="/reports">Reports</Link> : null}
      {user && user.role === "admin" ? <Link href="/admin/users">Admin</Link> : null}
      <span className="spacer" />
      {user ? (
        <>
          <span className="who">{user.first_name} {user.last_name} ({user.role})</span>
          <form action={logout}><button className="secondary small">Log out</button></form>
        </>
      ) : (
        <>
          <Link href="/login">Log in</Link>
          <Link href="/register">Register</Link>
        </>
      )}
    </nav>
  );
}
