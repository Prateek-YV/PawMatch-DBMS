import Link from "next/link";
import { pool } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Flash from "@/components/Flash";
import SqlBlock from "@/components/SqlBlock";
import { completeFoster, placeFoster } from "./actions";

export default async function FostersPage({ searchParams }) {
  const sp = await searchParams;
  const user = await requireUser(["foster", "shelter_staff", "admin"]);

  if (user.role === "foster") {
    const loadSql = "SELECT foster_name, max_capacity, active_fosters, spare_capacity, availability_status FROM v_foster_load WHERE user_id = ?";
    const [[load]] = await pool.query(loadSql, [user.user_id]);
    const sql = "SELECT fa.foster_id, p.pet_id, p.name AS pet_name, p.species, s.shelter_name, fa.start_date, fa.end_date, fa.status, DATEDIFF(COALESCE(fa.end_date, CURDATE()), fa.start_date) AS days FROM foster_assignment fa JOIN pet p ON p.pet_id = fa.pet_id JOIN shelter s ON s.shelter_id = p.shelter_id WHERE fa.user_id = ? ORDER BY fa.start_date DESC";
    const [rows] = await pool.query(sql, [user.user_id]);
    return (
      <>
        <h1>My foster care</h1>
        <Flash sp={sp} />
        {load ? <p className="sub">Capacity {load.max_capacity} · currently caring for {load.active_fosters} · spare {load.spare_capacity} · <span className={`badge ${load.availability_status}`}>{load.availability_status}</span></p> : null}
        <SqlBlock sql={loadSql} params={[user.user_id]} />
        <div className="table-wrap"><table><thead><tr><th>ID</th><th>Pet</th><th>Shelter</th><th>Start</th><th>End</th><th>Days</th><th>Status</th><th></th></tr></thead><tbody>
          {rows.map((f) => (
            <tr key={f.foster_id}>
              <td>{f.foster_id}</td>
              <td><Link href={`/pets/${f.pet_id}`}>{f.pet_name}</Link> ({f.species})</td>
              <td>{f.shelter_name}</td><td>{f.start_date}</td><td>{f.end_date || "—"}</td><td>{f.days}</td>
              <td><span className={`badge ${f.status}`}>{f.status}</span></td>
              <td>{f.status === "active" ? (<form action={completeFoster}><input type="hidden" name="foster_id" value={f.foster_id} /><button className="good small">Mark completed</button></form>) : null}</td>
            </tr>
          ))}
        </tbody></table></div>
        <p><Link className="btn" href="/pets">Find a pet to foster</Link></p>
        <SqlBlock sql={sql} params={[user.user_id]} />
      </>
    );
  }

  const isAdmin = user.role === "admin";
  const sql = "SELECT fa.foster_id, p.name AS pet_name, CONCAT(u.first_name, ' ', u.last_name) AS caregiver, s.shelter_name, fa.start_date, fa.end_date, fa.status FROM foster_assignment fa JOIN pet p ON p.pet_id = fa.pet_id JOIN users u ON u.user_id = fa.user_id JOIN shelter s ON s.shelter_id = p.shelter_id" + (isAdmin ? "" : " WHERE p.shelter_id = ?") + " ORDER BY fa.status, fa.start_date DESC";
  const [rows] = await pool.query(sql, isAdmin ? [] : [user.shelter_id]);
  const loadSql = "SELECT user_id, foster_name, max_capacity, active_fosters, spare_capacity, availability_status FROM v_foster_load ORDER BY spare_capacity DESC, foster_name";
  const [loads] = await pool.query(loadSql);
  const petSql = "SELECT pet_id, name, species FROM pet WHERE adoption_status = 'available'" + (isAdmin ? "" : " AND shelter_id = ?") + " ORDER BY name";
  const [available] = await pool.query(petSql, isAdmin ? [] : [user.shelter_id]);

  return (
    <>
      <h1>Foster care</h1>
      <p className="sub">Capacity rules are enforced by database triggers; placing and completing run as stored procedures.</p>
      <Flash sp={sp} />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Place a pet with a foster caregiver</h2>
        <form action={placeFoster} className="filters">
          <div><label>Pet</label><select name="pet_id" required>{available.map((p) => <option key={p.pet_id} value={p.pet_id}>{p.name} ({p.species})</option>)}</select></div>
          <div><label>Caregiver</label><select name="user_id" required>{loads.map((l) => <option key={l.user_id} value={l.user_id}>{l.foster_name} (spare {l.spare_capacity})</option>)}</select></div>
          <div><button>Place pet</button></div>
        </form>
      </div>
      <h2>Caregiver capacity</h2>
      <div className="table-wrap"><table><thead><tr><th>Caregiver</th><th>Max</th><th>Active</th><th>Spare</th><th>Availability</th></tr></thead><tbody>
        {loads.map((l) => (<tr key={l.user_id}><td>{l.foster_name}</td><td>{l.max_capacity}</td><td>{l.active_fosters}</td><td>{l.spare_capacity}</td><td><span className={`badge ${l.availability_status}`}>{l.availability_status}</span></td></tr>))}
      </tbody></table></div>
      <SqlBlock sql={loadSql} />
      <h2>All placements</h2>
      <div className="table-wrap"><table><thead><tr><th>ID</th><th>Pet</th><th>Caregiver</th><th>Shelter</th><th>Start</th><th>End</th><th>Status</th><th></th></tr></thead><tbody>
        {rows.map((f) => (
          <tr key={f.foster_id}>
            <td>{f.foster_id}</td><td>{f.pet_name}</td><td>{f.caregiver}</td><td>{f.shelter_name}</td><td>{f.start_date}</td><td>{f.end_date || "—"}</td>
            <td><span className={`badge ${f.status}`}>{f.status}</span></td>
            <td>{f.status === "active" ? (<form action={completeFoster}><input type="hidden" name="foster_id" value={f.foster_id} /><button className="good small">Complete</button></form>) : null}</td>
          </tr>
        ))}
      </tbody></table></div>
      <SqlBlock sql={sql} params={isAdmin ? [] : [user.shelter_id]} />
    </>
  );
}
