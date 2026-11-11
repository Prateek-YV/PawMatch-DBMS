import Link from "next/link";
import Flash from "@/components/Flash";
import { register } from "./actions";

export default async function RegisterPage({ searchParams }) {
  const sp = await searchParams;
  return (
    <div className="center" style={{ maxWidth: 640 }}>
      <h1>Create an account</h1>
      <p className="sub">Join as an adopter or a foster caregiver.</p>
      <Flash sp={sp} />
      <form action={register} className="card">
        <div className="grid cols-2">
          <div><label>First name</label><input name="first_name" required maxLength={30} /></div>
          <div><label>Last name</label><input name="last_name" required maxLength={30} /></div>
          <div><label>Email</label><input name="email" type="email" required /></div>
          <div><label>Password (min 8 characters)</label><input name="password" type="password" required minLength={8} /></div>
          <div><label>Phone (optional)</label><input name="phone" maxLength={15} placeholder="+919800000000" /></div>
          <div>
            <label>I want to</label>
            <select name="role" defaultValue="adopter">
              <option value="adopter">Adopt a pet</option>
              <option value="foster">Foster pets</option>
            </select>
          </div>
        </div>

        <h2>If adopting</h2>
        <div className="grid cols-3">
          <div>
            <label>Housing type</label>
            <select name="housing_type" defaultValue="house">
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="farm">Farm</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div><label>Household size</label><input name="household_size" type="number" min="1" defaultValue="1" /></div>
          <div className="inline" style={{ alignSelf: "end" }}><label><input type="checkbox" name="has_yard" /> I have a yard</label></div>
        </div>

        <h2>If fostering</h2>
        <div className="grid cols-2">
          <div><label>How many pets can you foster at once?</label><input name="max_capacity" type="number" min="1" defaultValue="1" /></div>
          <div><label>Years of experience</label><input name="experience_years" type="number" min="0" defaultValue="0" /></div>
        </div>

        <p><button>Register</button></p>
        <p className="meta">Already registered? <Link href="/login">Log in</Link></p>
      </form>
    </div>
  );
}
