import Link from "next/link";
import { pool } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Flash from "@/components/Flash";
import SqlBlock from "@/components/SqlBlock";
import { addPet } from "./actions";

export default async function StaffPets({ searchParams }) {
  const sp = await searchParams;
  const user = await requireUser(["shelter_staff", "admin"]);
  const isAdmin = user.role === "admin";

  const sql = "SELECT p.pet_id, p.name, p.species, p.breed, p.age, p.adoption_status, s.shelter_name, (SELECT COUNT(*) FROM adoption_application a WHERE a.pet_id = p.pet_id AND a.status = 'pending') AS pending_apps, (SELECT m.vaccination_status FROM medical_record m WHERE m.pet_id = p.pet_id ORDER BY m.record_no DESC LIMIT 1) AS vaccines FROM pet p JOIN shelter s ON s.shelter_id = p.shelter_id" + (isAdmin ? "" : " WHERE p.shelter_id = ?") + " ORDER BY p.pet_id";
  const [pets] = await pool.query(sql, isAdmin ? [] : [user.shelter_id]);
  const [shelters] = await pool.query("SELECT shelter_id, shelter_name FROM shelter ORDER BY shelter_name");

  return (
    <>
      <h1>Manage pets</h1>
      <p className="sub">Add, edit and remove pets. New pets are stored in MySQL and a matching profile is created in MongoDB.</p>
      <Flash sp={sp} />

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Add a new pet</h2>
        <form action={addPet}>
          <div className="grid cols-4">
            <div><label>Name</label><input name="name" required maxLength={40} /></div>
            <div><label>Species</label><select name="species"><option>Dog</option><option>Cat</option><option>Rabbit</option><option>Bird</option><option>Other</option></select></div>
            <div><label>Breed</label><input name="breed" maxLength={40} /></div>
            <div><label>Age (years)</label><input name="age" type="number" min="0" defaultValue="1" required /></div>
            <div><label>Gender</label><select name="gender"><option value="M">Male</option><option value="F">Female</option><option value="U">Unknown</option></select></div>
            <div><label>Size</label><select name="size" defaultValue="medium"><option>small</option><option>medium</option><option>large</option></select></div>
            <div><label>Energy (1-5)</label><input name="energy_level" type="number" min="1" max="5" defaultValue="3" /></div>
            {isAdmin ? (
              <div><label>Shelter</label><select name="shelter_id">{shelters.map((s) => <option key={s.shelter_id} value={s.shelter_id}>{s.shelter_name}</option>)}</select></div>
            ) : null}
          </div>
          <label>Temperament / description</label>
          <input name="temperament" maxLength={255} placeholder="Calm, friendly, good with kids" />
          <label>Traits (comma separated)</label>
          <input name="traits" placeholder="calm, friendly, kid-friendly" />
          <div className="inline" style={{ marginTop: 10 }}>
            <label><input type="checkbox" name="kids_ok" /> good with kids</label>
            <label><input type="checkbox" name="dogs_ok" /> good with dogs</label>
            <label><input type="checkbox" name="cats_ok" /> good with cats</label>
            <label><input type="checkbox" name="needs_yard" /> needs a yard</label>
            <label><input type="checkbox" name="needs_experience" /> needs experienced owner</label>
          </div>
          <p><button>Add pet</button></p>
        </form>
      </div>

      <div className="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Species</th><th>Breed</th><th>Age</th><th>Status</th><th>Shelter</th><th>Pending apps</th><th>Vaccines</th><th></th></tr></thead><tbody>
        {pets.map((p) => (
          <tr key={p.pet_id}>
            <td>{p.pet_id}</td><td>{p.name}</td><td>{p.species}</td><td>{p.breed || "—"}</td><td>{p.age}</td>
            <td><span className={`badge ${p.adoption_status}`}>{p.adoption_status}</span></td>
            <td>{p.shelter_name}</td><td>{p.pending_apps}</td>
            <td>{p.vaccines ? <span className={`badge ${p.vaccines}`}>{p.vaccines}</span> : "—"}</td>
            <td><Link href={`/staff/pets/${p.pet_id}`}>Edit</Link></td>
          </tr>
        ))}
      </tbody></table></div>
      <SqlBlock sql={sql} params={isAdmin ? [] : [user.shelter_id]} />
    </>
  );
}
