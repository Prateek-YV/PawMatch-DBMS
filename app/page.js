import Link from "next/link";
import { pool } from "@/lib/db";
import { getUser } from "@/lib/auth";
import Flash from "@/components/Flash";
import SqlBlock from "@/components/SqlBlock";
import DataTable from "@/components/DataTable";

export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const user = await getUser();

  const statsSql = "SELECT (SELECT COUNT(*) FROM pet) AS total_pets, (SELECT COUNT(*) FROM pet WHERE adoption_status = 'available') AS available_pets, (SELECT COUNT(*) FROM pet WHERE adoption_status = 'adopted') AS adopted_pets, (SELECT COUNT(*) FROM shelter) AS shelters";
  const [[stats]] = await pool.query(statsSql);

  if (!user) {
    return (
      <>
        <Flash sp={sp} />
        <div className="hero">
          <h1>Find a pet. Give a home.</h1>
          <p className="sub">PawMatch connects shelters, adopters and foster caregivers, and uses smart matching to suggest pets that fit your life.</p>
          <p><Link className="btn" href="/pets">Browse available pets</Link> <Link className="btn secondary" href="/register">Create an account</Link></p>
        </div>
        <div className="grid cols-4">
          <div className="card stat"><div className="n">{stats.available_pets}</div><div className="l">pets looking for a home</div></div>
          <div className="card stat"><div className="n">{stats.adopted_pets}</div><div className="l">pets adopted</div></div>
          <div className="card stat"><div className="n">{stats.total_pets}</div><div className="l">pets in the system</div></div>
          <div className="card stat"><div className="n">{stats.shelters}</div><div className="l">partner shelters</div></div>
        </div>
        <SqlBlock sql={statsSql} />
      </>
    );
  }

  let body = null;

  if (user.role === "adopter") {
    const appSql = "SELECT a.application_id, a.application_date, a.status, p.pet_id, p.name AS pet_name, s.shelter_name FROM adoption_application a JOIN pet p ON p.pet_id = a.pet_id JOIN shelter s ON s.shelter_id = p.shelter_id WHERE a.user_id = ? ORDER BY a.application_date DESC LIMIT 5";
    const [apps] = await pool.query(appSql, [user.user_id]);
    const matchSql = "CALL sp_top_matches(?, ?)";
    const [matchRes] = await pool.query(matchSql, [user.user_id, 3]);
    const matches = matchRes[0] || [];
    body = (
      <div className="two-col">
        <div>
          <h2>My latest applications</h2>
          {apps.length === 0 ? <p className="meta">You have not applied yet. <Link href="/pets">Browse pets</Link></p> : (
            <div className="table-wrap"><table><thead><tr><th>ID</th><th>Pet</th><th>Shelter</th><th>Date</th><th>Status</th></tr></thead><tbody>
              {apps.map((a) => (<tr key={a.application_id}><td>{a.application_id}</td><td><Link href={`/pets/${a.pet_id}`}>{a.pet_name}</Link></td><td>{a.shelter_name}</td><td>{a.application_date}</td><td><span className={`badge ${a.status}`}>{a.status}</span></td></tr>))}
            </tbody></table></div>
          )}
          <SqlBlock sql={appSql} params={[user.user_id]} />
        </div>
        <div>
          <h2>Top matches for me</h2>
          {matches.length === 0 ? <p className="meta">No matches yet. <Link href="/recommendations">Set your preferences</Link> to get recommendations.</p> : (
            <div className="table-wrap"><table><thead><tr><th>Pet</th><th>Breed</th><th>Shelter</th><th>Score</th></tr></thead><tbody>
              {matches.map((m) => (<tr key={m.pet_id}><td><Link href={`/pets/${m.pet_id}`}>{m.pet_name}</Link></td><td>{m.breed}</td><td>{m.shelter_name}</td><td>{m.match_score}</td></tr>))}
            </tbody></table></div>
          )}
          <SqlBlock sql={matchSql} params={[user.user_id, 3]} />
        </div>
      </div>
    );
  } else if (user.role === "foster") {
    const loadSql = "SELECT foster_name, max_capacity, active_fosters, spare_capacity, availability_status FROM v_foster_load WHERE user_id = ?";
    const [[load]] = await pool.query(loadSql, [user.user_id]);
    const placeSql = "SELECT fa.foster_id, p.pet_id, p.name AS pet_name, p.species, fa.start_date, fa.status FROM foster_assignment fa JOIN pet p ON p.pet_id = fa.pet_id WHERE fa.user_id = ? AND fa.status = 'active' ORDER BY fa.start_date";
    const [placements] = await pool.query(placeSql, [user.user_id]);
    body = (
      <>
        {load ? (
          <div className="grid cols-3">
            <div className="card stat"><div className="n">{load.active_fosters}</div><div className="l">pets in my care</div></div>
            <div className="card stat"><div className="n">{load.spare_capacity}</div><div className="l">spare capacity</div></div>
            <div className="card stat"><div className="n"><span className={`badge ${load.availability_status}`}>{load.availability_status}</span></div><div className="l">availability</div></div>
          </div>
        ) : null}
        <SqlBlock sql={loadSql} params={[user.user_id]} />
        <h2>Pets currently in my care</h2>
        {placements.length === 0 ? <p className="meta">None right now. <Link href="/pets">Find a pet to foster</Link></p> : (
          <div className="table-wrap"><table><thead><tr><th>Placement</th><th>Pet</th><th>Species</th><th>Since</th></tr></thead><tbody>
            {placements.map((f) => (<tr key={f.foster_id}><td>{f.foster_id}</td><td><Link href={`/pets/${f.pet_id}`}>{f.pet_name}</Link></td><td>{f.species}</td><td>{f.start_date}</td></tr>))}
          </tbody></table></div>
        )}
        <SqlBlock sql={placeSql} params={[user.user_id]} />
      </>
    );
  } else {
    const isAdmin = user.role === "admin";
    const sumSql = isAdmin ? "SELECT shelter_name, city, total_pets, available, pending, fostered, adopted FROM v_shelter_summary ORDER BY shelter_name" : "SELECT shelter_name, city, total_pets, available, pending, fostered, adopted FROM v_shelter_summary WHERE shelter_id = ?";
    const [summary] = await pool.query(sumSql, isAdmin ? [] : [user.shelter_id]);
    const queueSql = isAdmin ? "SELECT a.application_id, a.application_date, a.status, p.name AS pet_name, CONCAT(u.first_name, ' ', u.last_name) AS applicant FROM adoption_application a JOIN pet p ON p.pet_id = a.pet_id JOIN users u ON u.user_id = a.user_id WHERE a.status = 'pending' ORDER BY a.application_date" : "SELECT a.application_id, a.application_date, a.status, p.name AS pet_name, CONCAT(u.first_name, ' ', u.last_name) AS applicant FROM adoption_application a JOIN pet p ON p.pet_id = a.pet_id JOIN users u ON u.user_id = a.user_id WHERE a.status = 'pending' AND p.shelter_id = ? ORDER BY a.application_date";
    const [queue] = await pool.query(queueSql, isAdmin ? [] : [user.shelter_id]);
    body = (
      <>
        <h2>Shelter summary</h2>
        <DataTable rows={summary} />
        <SqlBlock sql={sumSql} params={isAdmin ? [] : [user.shelter_id]} />
        <h2>Pending applications waiting for review ({queue.length})</h2>
        <DataTable rows={queue} />
        <p><Link className="btn" href="/applications">Open review queue</Link></p>
        <SqlBlock sql={queueSql} params={isAdmin ? [] : [user.shelter_id]} />
      </>
    );
  }

  return (
    <>
      <Flash sp={sp} />
      <h1>Welcome, {user.first_name}</h1>
      <p className="sub">Signed in as {user.role.replace("_", " ")}.</p>
      {body}
    </>
  );
}
