import Link from "next/link";
import { pool } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Flash from "@/components/Flash";
import SqlBlock from "@/components/SqlBlock";
import { approveApplication, rejectApplication, withdrawApplication } from "./actions";

export default async function ApplicationsPage({ searchParams }) {
  const sp = await searchParams;
  const user = await requireUser(["adopter", "shelter_staff", "admin"]);

  if (user.role === "adopter") {
    const sql = "SELECT a.application_id, a.application_date, a.status, a.decision_date, p.pet_id, p.name AS pet_name, p.species, s.shelter_name, CONCAT(r.first_name, ' ', r.last_name) AS reviewer FROM adoption_application a JOIN pet p ON p.pet_id = a.pet_id JOIN shelter s ON s.shelter_id = p.shelter_id LEFT JOIN users r ON r.user_id = a.reviewed_by WHERE a.user_id = ? ORDER BY a.application_date DESC, a.application_id DESC";
    const [apps] = await pool.query(sql, [user.user_id]);
    return (
      <>
        <h1>My applications</h1>
        <p className="sub">Track your adoption applications.</p>
        <Flash sp={sp} />
        {apps.length === 0 ? <p className="meta">No applications yet. <Link href="/pets">Browse pets</Link></p> : (
          <div className="table-wrap"><table><thead><tr><th>ID</th><th>Pet</th><th>Shelter</th><th>Applied</th><th>Status</th><th>Decision</th><th>Reviewed by</th><th></th></tr></thead><tbody>
            {apps.map((a) => (
              <tr key={a.application_id}>
                <td>{a.application_id}</td>
                <td><Link href={`/pets/${a.pet_id}`}>{a.pet_name}</Link> ({a.species})</td>
                <td>{a.shelter_name}</td>
                <td>{a.application_date}</td>
                <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                <td>{a.decision_date || "—"}</td>
                <td>{a.reviewer || "—"}</td>
                <td>{a.status === "pending" ? (<form action={withdrawApplication}><input type="hidden" name="application_id" value={a.application_id} /><button className="danger small">Withdraw</button></form>) : null}</td>
              </tr>
            ))}
          </tbody></table></div>
        )}
        <SqlBlock sql={sql} params={[user.user_id]} />
      </>
    );
  }

  const isAdmin = user.role === "admin";
  const status = sp.status || "pending";
  const where = [];
  const params = [];
  if (!isAdmin) { where.push("p.shelter_id = ?"); params.push(user.shelter_id); }
  if (status !== "all") { where.push("a.status = ?"); params.push(status); }
  const whereSql = where.length ? " WHERE " + where.join(" AND ") : "";
  const sql = "SELECT a.application_id, a.application_date, a.status, a.decision_date, p.pet_id, p.name AS pet_name, s.shelter_name, CONCAT(u.first_name, ' ', u.last_name) AS applicant, ap.housing_type, ap.has_yard, ap.household_size, (SELECT COUNT(*) FROM adoption_application a2 WHERE a2.pet_id = a.pet_id AND a2.status = 'pending') AS competing, CONCAT(r.first_name, ' ', r.last_name) AS reviewer FROM adoption_application a JOIN pet p ON p.pet_id = a.pet_id JOIN shelter s ON s.shelter_id = p.shelter_id JOIN users u ON u.user_id = a.user_id LEFT JOIN adopter_profile ap ON ap.user_id = a.user_id LEFT JOIN users r ON r.user_id = a.reviewed_by" + whereSql + " ORDER BY a.application_date, a.application_id";
  const [apps] = await pool.query(sql, params);

  return (
    <>
      <h1>Application review</h1>
      <p className="sub">{isAdmin ? "All shelters" : "Your shelter's pets"}. Approving runs a database transaction: it adopts the pet, rejects competing applications and closes any active foster placement.</p>
      <Flash sp={sp} />
      <form className="card inline" method="get">
        <label>Status
          <select name="status" defaultValue={status} style={{ marginLeft: 8 }}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="all">All</option>
          </select>
        </label>
        <button className="small">Filter</button>
      </form>
      {apps.length === 0 ? <p className="meta">Nothing here.</p> : (
        <div className="table-wrap"><table><thead><tr><th>ID</th><th>Pet</th><th>Applicant</th><th>Home</th><th>Applied</th><th>Status</th><th>Competing</th><th>Reviewer</th><th></th></tr></thead><tbody>
          {apps.map((a) => (
            <tr key={a.application_id}>
              <td>{a.application_id}</td>
              <td><Link href={`/pets/${a.pet_id}`}>{a.pet_name}</Link><div className="meta">{a.shelter_name}</div></td>
              <td>{a.applicant}</td>
              <td className="meta">{a.housing_type ? `${a.housing_type}, yard: ${a.has_yard === "Y" ? "yes" : "no"}, ${a.household_size} people` : "no profile"}</td>
              <td>{a.application_date}</td>
              <td><span className={`badge ${a.status}`}>{a.status}</span></td>
              <td>{a.status === "pending" ? a.competing : "—"}</td>
              <td>{a.reviewer || "—"}</td>
              <td>
                {a.status === "pending" ? (
                  <div className="row-actions">
                    <form action={approveApplication}><input type="hidden" name="application_id" value={a.application_id} /><button className="good small">Approve</button></form>
                    <form action={rejectApplication}><input type="hidden" name="application_id" value={a.application_id} /><button className="danger small">Reject</button></form>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody></table></div>
      )}
      <SqlBlock sql={sql} params={params} />
    </>
  );
}
