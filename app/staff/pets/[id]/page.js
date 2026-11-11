import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Flash from "@/components/Flash";
import SqlBlock from "@/components/SqlBlock";
import { updatePet, addMedicalRecord, deleteMedicalRecord, addImage, deletePet } from "../actions";

export default async function EditPet({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser(["shelter_staff", "admin"]);

  const petSql = "SELECT p.pet_id, p.name, p.species, p.breed, p.age, p.gender, p.temperament, p.adoption_status, p.shelter_id, s.shelter_name FROM pet p JOIN shelter s ON s.shelter_id = p.shelter_id WHERE p.pet_id = ?";
  const [[pet]] = await pool.query(petSql, [id]);
  if (!pet) notFound();
  if (user.role !== "admin" && pet.shelter_id !== user.shelter_id) redirect("/staff/pets?err=" + encodeURIComponent("You can only manage pets of your own shelter"));

  const [records] = await pool.query("SELECT record_no, checkup_date, vaccination_status, diagnosis FROM medical_record WHERE pet_id = ? ORDER BY record_no", [id]);
  const [images] = await pool.query("SELECT image_no, image_url, uploaded_date FROM pet_image WHERE pet_id = ? ORDER BY image_no", [id]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <p><Link href="/staff/pets">← Back to manage pets</Link></p>
      <h1>Edit {pet.name} <span className={`badge ${pet.adoption_status}`}>{pet.adoption_status}</span></h1>
      <p className="sub">{pet.pet_id} · {pet.shelter_name}</p>
      <Flash sp={sp} />

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Details</h2>
        <form action={updatePet}>
          <input type="hidden" name="pet_id" value={pet.pet_id} />
          <div className="grid cols-4">
            <div><label>Name</label><input name="name" defaultValue={pet.name} required /></div>
            <div><label>Species</label><select name="species" defaultValue={pet.species}><option>Dog</option><option>Cat</option><option>Rabbit</option><option>Bird</option><option>Other</option></select></div>
            <div><label>Breed</label><input name="breed" defaultValue={pet.breed || ""} /></div>
            <div><label>Age</label><input name="age" type="number" min="0" defaultValue={pet.age} /></div>
            <div><label>Gender</label><select name="gender" defaultValue={pet.gender}><option value="M">Male</option><option value="F">Female</option><option value="U">Unknown</option></select></div>
            <div><label>Status</label><select name="adoption_status" defaultValue={pet.adoption_status}><option>available</option><option>pending</option><option>fostered</option><option>adopted</option></select></div>
          </div>
          <label>Temperament</label>
          <input name="temperament" defaultValue={pet.temperament || ""} />
          <p><button>Save changes</button></p>
        </form>
        <SqlBlock sql="UPDATE pet SET name = ?, species = ?, breed = ?, age = ?, gender = ?, temperament = ?, adoption_status = ? WHERE pet_id = ?" />
      </div>

      <div className="two-col">
        <div>
          <h2>Medical records</h2>
          <div className="table-wrap"><table><thead><tr><th>#</th><th>Date</th><th>Vaccines</th><th>Notes</th><th></th></tr></thead><tbody>
            {records.map((r) => (
              <tr key={r.record_no}>
                <td>{r.record_no}</td><td>{r.checkup_date}</td><td><span className={`badge ${r.vaccination_status}`}>{r.vaccination_status}</span></td><td>{r.diagnosis || "—"}</td>
                <td><form action={deleteMedicalRecord}><input type="hidden" name="pet_id" value={pet.pet_id} /><input type="hidden" name="record_no" value={r.record_no} /><button className="danger small">Delete</button></form></td>
              </tr>
            ))}
          </tbody></table></div>
          <form action={addMedicalRecord} className="card">
            <input type="hidden" name="pet_id" value={pet.pet_id} />
            <div className="grid cols-2">
              <div><label>Checkup date</label><input name="checkup_date" type="date" defaultValue={today} required /></div>
              <div><label>Vaccination status</label><select name="vaccination_status"><option value="up_to_date">up_to_date</option><option value="pending">pending</option><option value="overdue">overdue</option></select></div>
            </div>
            <label>Diagnosis / notes</label>
            <input name="diagnosis" maxLength={255} />
            <p><button className="small">Add record</button></p>
          </form>
          <SqlBlock sql="INSERT INTO medical_record (pet_id, record_no, checkup_date, vaccination_status, diagnosis) VALUES (?, ?, ?, ?, ?)" />
        </div>
        <div>
          <h2>Images</h2>
          <div className="table-wrap"><table><thead><tr><th>#</th><th>URL</th><th>Uploaded</th></tr></thead><tbody>
            {images.map((i) => (<tr key={i.image_no}><td>{i.image_no}</td><td>{i.image_url}</td><td>{i.uploaded_date}</td></tr>))}
          </tbody></table></div>
          <form action={addImage} className="card">
            <input type="hidden" name="pet_id" value={pet.pet_id} />
            <label>Image URL</label>
            <input name="image_url" required maxLength={255} placeholder="/images/pets/p016_1.jpg" />
            <p><button className="small">Add image</button></p>
          </form>
          <h2>Danger zone</h2>
          <form action={deletePet} className="card">
            <input type="hidden" name="pet_id" value={pet.pet_id} />
            <p className="meta">Deleting a pet also removes its medical records, images, applications, foster placements and matches (ON DELETE CASCADE).</p>
            <button className="danger">Delete this pet</button>
          </form>
        </div>
      </div>
    </>
  );
}
