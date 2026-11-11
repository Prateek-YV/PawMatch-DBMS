import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { safeMongo } from "@/lib/mongo";
import Flash from "@/components/Flash";
import SqlBlock from "@/components/SqlBlock";
import { applyForPet, fosterPet, favoritePet } from "../actions";

export default async function PetDetail({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getUser();

  const petSql = "SELECT p.pet_id, p.name, p.species, p.breed, p.age, p.gender, p.temperament, p.adoption_status, p.intake_date, s.shelter_name, s.city, s.phone_no, s.email, (SELECT COUNT(*) FROM adoption_application a WHERE a.pet_id = p.pet_id AND a.status = 'pending') AS pending_applications FROM pet p JOIN shelter s ON s.shelter_id = p.shelter_id WHERE p.pet_id = ?";
  const [[pet]] = await pool.query(petSql, [id]);
  if (!pet) notFound();

  const imgSql = "SELECT image_no, image_url FROM pet_image WHERE pet_id = ? ORDER BY image_no";
  const [images] = await pool.query(imgSql, [id]);
  const medSql = "SELECT record_no, checkup_date, vaccination_status, diagnosis FROM medical_record WHERE pet_id = ? ORDER BY record_no DESC";
  const [records] = await pool.query(medSql, [id]);

  let myApplication = null;
  if (user && user.role === "adopter") {
    const mySql = "SELECT application_id, status, application_date FROM adoption_application WHERE user_id = ? AND pet_id = ? ORDER BY application_date DESC LIMIT 1";
    [[myApplication]] = await pool.query(mySql, [user.user_id, id]);
  }

  const profile = await safeMongo((db) => db.collection("pet_profiles").findOne({ pet_id: id }, { projection: { _id: 0 } }), null);
  if (user && user.role === "adopter") {
    await safeMongo((db) => db.collection("user_activity").insertOne({ user_id: user.user_id, pet_id: id, action: "view", ts: new Date(), meta: { device: "web" } }));
  }

  const canApply = user && user.role === "adopter" && pet.adoption_status !== "adopted";
  const canFoster = user && user.role === "foster" && pet.adoption_status !== "adopted" && pet.adoption_status !== "fostered";

  return (
    <>
      <p><Link href="/pets">← Back to pets</Link></p>
      <Flash sp={sp} />
      <div className="two-col">
        <div>
          <h1>{pet.name} <span className={`badge ${pet.adoption_status}`}>{pet.adoption_status}</span></h1>
          <p className="sub">{pet.breed || pet.species} · {pet.age} yr · {pet.gender === "M" ? "Male" : pet.gender === "F" ? "Female" : "Unknown"}</p>
          <div className="grid cols-2">
            {images.map((i) => <img className="hero-img" key={i.image_no} src={i.image_url} alt={pet.name} />)}
          </div>
          <div className="card" style={{ marginTop: "1rem" }}>
            <h2 style={{ marginTop: 0 }}>About {pet.name}</h2>
            <p>{pet.temperament}</p>
            {profile ? (
              <>
                <p>{profile.description}</p>
                <div className="tags">{(profile.traits || []).map((t) => <span key={t}>{t}</span>)}</div>
                <p className="meta">
                  Good with kids: {profile.good_with?.kids ? "yes" : "no"} · dogs: {profile.good_with?.dogs ? "yes" : "no"} · cats: {profile.good_with?.cats ? "yes" : "no"}<br />
                  Needs yard: {profile.needs?.yard_required ? "yes" : "no"} · Needs experienced owner: {profile.needs?.experienced_owner ? "yes" : "no"} · Energy: {profile.energy_level}/5
                </p>
                <p className="meta">Profile loaded from MongoDB (pet_profiles).</p>
              </>
            ) : null}
          </div>
          <SqlBlock sql={petSql} params={[id]} />
        </div>

        <div>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Shelter</h2>
            <p><strong>{pet.shelter_name}</strong>, {pet.city}<br />{pet.phone_no} · {pet.email}</p>
            <p className="meta">In care since {pet.intake_date} · {pet.pending_applications} pending application(s)</p>
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Take action</h2>
            {!user ? <p><Link href="/login">Log in</Link> to apply for {pet.name}.</p> : null}
            {myApplication ? <p>Your latest application: <span className={`badge ${myApplication.status}`}>{myApplication.status}</span> ({myApplication.application_date})</p> : null}
            <div className="row-actions">
              {canApply ? (
                <form action={applyForPet}><input type="hidden" name="pet_id" value={pet.pet_id} /><button>Apply to adopt</button></form>
              ) : null}
              {user && user.role === "adopter" ? (
                <form action={favoritePet}><input type="hidden" name="pet_id" value={pet.pet_id} /><button className="secondary">♥ Favourite</button></form>
              ) : null}
              {canFoster ? (
                <form action={fosterPet}><input type="hidden" name="pet_id" value={pet.pet_id} /><button className="good">Foster this pet</button></form>
              ) : null}
            </div>
            {user && (user.role === "shelter_staff" || user.role === "admin") ? <p><Link href={`/staff/pets/${pet.pet_id}`}>Edit this pet →</Link></p> : null}
          </div>

          <h2>Medical history</h2>
          {records.length === 0 ? <p className="meta">No records.</p> : (
            <div className="table-wrap"><table><thead><tr><th>#</th><th>Date</th><th>Vaccines</th><th>Notes</th></tr></thead><tbody>
              {records.map((r) => (<tr key={r.record_no}><td>{r.record_no}</td><td>{r.checkup_date}</td><td><span className={`badge ${r.vaccination_status}`}>{r.vaccination_status}</span></td><td>{r.diagnosis || "—"}</td></tr>))}
            </tbody></table></div>
          )}
          <SqlBlock sql={medSql} params={[id]} />
        </div>
      </div>
    </>
  );
}
