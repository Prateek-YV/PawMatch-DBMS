import { pool } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { safeMongo } from "@/lib/mongo";
import DataTable from "@/components/DataTable";
import SqlBlock from "@/components/SqlBlock";

const REPORTS = [
  { title: "Shelter occupancy (view with SUM/CASE aggregation)", sql: "SELECT shelter_name, city, total_pets, available, pending, fostered, adopted FROM v_shelter_summary ORDER BY shelter_name" },
  { title: "Approval rate per shelter (JOIN, GROUP BY, HAVING)", sql: "SELECT s.shelter_name, COUNT(*) AS total_applications, SUM(a.status = 'approved') AS approved, ROUND(100 * SUM(a.status = 'approved') / COUNT(*), 1) AS approval_pct FROM adoption_application a JOIN pet p ON p.pet_id = a.pet_id JOIN shelter s ON s.shelter_id = p.shelter_id GROUP BY s.shelter_name HAVING COUNT(*) >= 2 ORDER BY approval_pct DESC" },
  { title: "Available pets nobody has applied for (LEFT JOIN anti-join)", sql: "SELECT p.pet_id, p.name, p.species, p.intake_date, DATEDIFF(CURDATE(), p.intake_date) AS days_waiting FROM pet p LEFT JOIN adoption_application a ON a.pet_id = p.pet_id WHERE a.application_id IS NULL AND p.adoption_status = 'available' ORDER BY p.intake_date" },
  { title: "Pets whose latest vaccination record is overdue or pending (correlated subquery)", sql: "SELECT p.pet_id, p.name, m.vaccination_status, m.checkup_date, m.diagnosis FROM pet p JOIN medical_record m ON m.pet_id = p.pet_id WHERE m.record_no = (SELECT MAX(m2.record_no) FROM medical_record m2 WHERE m2.pet_id = p.pet_id) AND m.vaccination_status IN ('overdue', 'pending') ORDER BY m.vaccination_status, p.name" },
  { title: "Average days to decide per reviewer (aggregate + DATEDIFF)", sql: "SELECT CONCAT(u.first_name, ' ', u.last_name) AS reviewer, COUNT(*) AS reviewed, ROUND(AVG(DATEDIFF(a.decision_date, a.application_date)), 1) AS avg_days FROM adoption_application a JOIN users u ON u.user_id = a.reviewed_by WHERE a.decision_date IS NOT NULL GROUP BY u.user_id, u.first_name, u.last_name ORDER BY reviewed DESC" },
  { title: "Top 2 stored matches per adopter (window function)", sql: "SELECT t.adopter, t.pet_name, t.match_score, t.rnk FROM (SELECT CONCAT(u.first_name, ' ', u.last_name) AS adopter, p.name AS pet_name, m.match_score, ROW_NUMBER() OVER (PARTITION BY m.user_id ORDER BY m.match_score DESC) AS rnk FROM pet_match m JOIN pet p ON p.pet_id = m.pet_id JOIN users u ON u.user_id = m.user_id WHERE p.adoption_status = 'available') t WHERE t.rnk <= 2 ORDER BY t.adopter, t.rnk" },
  { title: "Pets older than their species average (CTE)", sql: "WITH avg_age AS (SELECT species, AVG(age) AS mean_age FROM pet GROUP BY species) SELECT p.name, p.species, p.age, ROUND(x.mean_age, 1) AS species_avg FROM pet p JOIN avg_age x ON x.species = p.species WHERE p.age > x.mean_age ORDER BY p.species, p.age DESC" },
  { title: "Foster caregiver capacity (view with LEFT JOIN and GROUP BY)", sql: "SELECT foster_name, max_capacity, active_fosters, spare_capacity, availability_status FROM v_foster_load ORDER BY spare_capacity DESC" },
  { title: "Adopters with more than one application (GROUP_CONCAT, HAVING)", sql: "SELECT CONCAT(u.first_name, ' ', u.last_name) AS adopter, COUNT(*) AS applications, GROUP_CONCAT(p.name ORDER BY p.name SEPARATOR ', ') AS pets FROM users u JOIN adoption_application a ON a.user_id = u.user_id JOIN pet p ON p.pet_id = a.pet_id GROUP BY u.user_id, u.first_name, u.last_name HAVING COUNT(*) > 1" },
];

export default async function Reports() {
  await requireUser(["shelter_staff", "admin"]);
  const results = [];
  for (const r of REPORTS) {
    const [rows] = await pool.query(r.sql);
    results.push({ ...r, rows });
  }

  const favourites = await safeMongo((db) => db.collection("user_activity").aggregate([
    { $match: { action: "favorite" } },
    { $group: { _id: "$pet_id", favourites: { $sum: 1 } } },
    { $sort: { favourites: -1, _id: 1 } },
    { $limit: 5 },
    { $lookup: { from: "pet_profiles", localField: "_id", foreignField: "pet_id", as: "pet" } },
    { $unwind: "$pet" },
    { $project: { _id: 0, pet_id: "$_id", name: "$pet.name", species: "$pet.species", favourites: 1 } },
  ]).toArray(), null);
  const perUser = await safeMongo((db) => db.collection("user_activity").aggregate([
    { $group: { _id: { user_id: "$user_id", action: "$action" }, total: { $sum: 1 } } },
    { $sort: { "_id.user_id": 1, "_id.action": 1 } },
    { $project: { _id: 0, user_id: "$_id.user_id", action: "$_id.action", total: 1 } },
  ]).toArray(), null);

  return (
    <>
      <h1>Reports</h1>
      <p className="sub">Every table below is produced by the SQL statement shown under it (or the MongoDB aggregation at the bottom).</p>
      {results.map((r) => (
        <div key={r.title}>
          <h2>{r.title}</h2>
          <DataTable rows={r.rows} />
          <SqlBlock sql={r.sql} />
        </div>
      ))}
      <h2>Most favourited pets (MongoDB aggregation: $match, $group, $lookup)</h2>
      {favourites === null ? <p className="meta">MongoDB is not reachable.</p> : <DataTable rows={favourites} />}
      <SqlBlock sql={"db.user_activity.aggregate([ { $match: { action: 'favorite' } }, { $group: { _id: '$pet_id', favourites: { $sum: 1 } } }, { $sort: { favourites: -1 } }, { $limit: 5 }, { $lookup: { from: 'pet_profiles', localField: '_id', foreignField: 'pet_id', as: 'pet' } }, { $unwind: '$pet' } ])"} />
      <h2>Activity per user and action (MongoDB aggregation: $group)</h2>
      {perUser === null ? <p className="meta">MongoDB is not reachable.</p> : <DataTable rows={perUser} />}
    </>
  );
}
