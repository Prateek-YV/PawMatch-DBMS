import Link from "next/link";
import Flash from "@/components/Flash";
import { login } from "./actions";

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  return (
    <div className="center">
      <h1>Log in</h1>
      <p className="sub">Welcome back to PawMatch.</p>
      <Flash sp={sp} />
      <form action={login} className="card">
        <label>Email</label>
        <input name="email" type="email" required />
        <label>Password</label>
        <input name="password" type="password" required />
        <p><button>Log in</button></p>
        <p className="meta">New here? <Link href="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
