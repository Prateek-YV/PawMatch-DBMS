import { pool } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Flash from "@/components/Flash";
import SqlBlock from "@/components/SqlBlock";
import { updateUserRole, deleteUser, addShelter } from "./actions";

export default async function AdminUsers({ searchParams }) {
  const sp = await searchParams;
  const admin = await requireUser(["admin"]);

  const sql = "SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS name, u.email, u.role, u.shelter_id, s.shelter_name, u.date_joined, (SELECT GROUP_CONCAT(up.phone_no SEPARATOR ', ') FROM user_phone up WHERE up.user_id = u.user_id) AS phones FROM users u LEFT JOIN shelter s ON s.shelter_id = u.shelter_id ORDER BY u.user_id";
  const [users] = await pool.query(sql);
  const [shelters] = await pool.query("SELECT shelter_id, shelter_name FROM shelter ORDER BY shelter_name");

  return (
    <>
      <h1>Admin</h1>
      <p className="sub">Manage users, roles and shelters.</p>
      <Flash sp={sp} />

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Add a shelter</h2>
        <form action={addShelter} className="filters">
          <div><label>Name</label><input name="shelter_name" required maxLength={60} /></div>
          <div><label>City</label><input name="city" required maxLength={40} /></div>
          <div><label>Phone</label><input name="phone_no" required maxLength={15} /></div>
          <div><label>Email</label><input name="email" type="email" required /></div>
          <div><button>Add shelter</button></div>
        </form>
      </div>

      <div className="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phones</th><th>Role / shelter</th><th></th></tr></thead><tbody>
        {users.map((u) => (
          <tr key={u.user_id}>
            <td>{u.user_id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.phones || "—"}</td>
            <td>
              <form action={updateUserRole} className="row-actions">
                <input type="hidden" name="user_id" value={u.user_id} />
                <select name="role" defaultValue={u.role} style={{ width: 130 }}><option>admin</option><option>shelter_staff</option><option>adopter</option><option>foster</option></select>
                <select name="shelter_id" defaultValue={u.shelter_id || ""} style={{ width: 170 }}><option value="">(no shelter)</option>{shelters.map((s) => <option key={s.shelter_id} value={s.shelter_id}>{s.shelter_name}</option>)}</select>
                <button className="small" disabled={u.user_id === admin.user_id}>Save</button>
              </form>
            </td>
            <td>{u.user_id !== admin.user_id ? (<form action={deleteUser}><input type="hidden" name="user_id" value={u.user_id} /><button className="danger small">Delete</button></form>) : null}</td>
          </tr>
        ))}
      </tbody></table></div>
      <SqlBlock sql={sql} />
    </>
  );
}
