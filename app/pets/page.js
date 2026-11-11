import Link from "next/link";
import { pool } from "@/lib/db";
import SqlBlock from "@/components/SqlBlock";

const SORTS = {
  newest: "p.intake_date DESC",
  name: "p.name ASC",
  age_asc: "p.age ASC, p.name ASC",
  age_desc: "p.age DESC, p.name ASC",
};

export default async function PetsPage({ searchParams }) {
  const sp = await searchParams;
  const status = sp.status || "available";
  const species = sp.species || "";
  const shelter = sp.shelter || "";
  const q = (sp.q || "").trim();
  const maxAge = sp.max_age || "";
  const sort = SORTS[sp.sort] ? sp.sort : "newest";

  const where = [];
  const params = [];
  if (status !== "all") { where.push("p.adoption_status = ?"); params.push(status); }
  if (species) { where.push("p.species = ?"); params.push(species); }
  if (shelter) { where.push("p.shelter_id = ?"); params.push(shelter); }
  if (maxAge) { where.push("p.age <= ?"); params.push(Number(maxAge)); }
  if (q) {
    where.push("(MATCH(p.temperament, p.breed) AGAINST (? IN NATURAL LANGUAGE MODE) OR p.name LIKE ? OR p.breed LIKE ?)");
    params.push(q, `%${q}%`, `%${q}%`);
  }
  const whereSql = where.length ? " WHERE " + where.join(" AND ") : "";

  const listSql = "SELECT p.pet_id, p.name, p.species, p.breed, p.age, p.gender, p.temperament, p.adoption_status, s.shelter_name, s.city, (SELECT i.image_url FROM pet_image i WHERE i.pet_id = p.pet_id ORDER BY i.image_no LIMIT 1) AS image FROM pet p JOIN shelter s ON s.shelter_id = p.shelter_id" + whereSql + " ORDER BY " + SORTS[sort];
  const [pets] = await pool.query(listSql, params);

  const facetSql = "SELECT species, COUNT(*) AS total FROM pet WHERE adoption_status = 'available' GROUP BY species HAVING COUNT(*) > 0 ORDER BY total DESC, species";
  const [facets] = await pool.query(facetSql);
  const [shelters] = await pool.query("SELECT shelter_id, shelter_name FROM shelter ORDER BY shelter_name");

  return (
    <>
      <h1>Browse pets</h1>
      <p className="sub">Search by name, breed or personality (full-text search), then filter and sort.</p>

      <form className="card filters" method="get">
        <div><label>Search</label><input name="q" defaultValue={q} placeholder="calm, playful, beagle..." /></div>
        <div>
          <label>Species</label>
          <select name="species" defaultValue={species}>
            <option value="">Any</option>
            {facets.map((f) => <option key={f.species} value={f.species}>{f.species} ({f.total})</option>)}
          </select>
        </div>
        <div>
          <label>Shelter</label>
          <select name="shelter" defaultValue={shelter}>
            <option value="">Any</option>
            {shelters.map((s) => <option key={s.shelter_id} value={s.shelter_id}>{s.shelter_name}</option>)}
          </select>
        </div>
        <div>
          <label>Status</label>
          <select name="status" defaultValue={status}>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="fostered">Fostered</option>
            <option value="adopted">Adopted</option>
            <option value="all">All</option>
          </select>
        </div>
        <div><label>Max age (years)</label><input name="max_age" type="number" min="0" defaultValue={maxAge} /></div>
        <div>
          <label>Sort by</label>
          <select name="sort" defaultValue={sort}>
            <option value="newest">Newest arrivals</option>
            <option value="name">Name</option>
            <option value="age_asc">Youngest first</option>
            <option value="age_desc">Oldest first</option>
          </select>
        </div>
        <div><button>Apply filters</button></div>
      </form>

      <p className="meta">{pets.length} pet(s) found</p>
      <div className="grid cols-3">
        {pets.map((p) => (
          <div className="card pet-card" key={p.pet_id}>
            <img src={p.image || "/images/pets/none.jpg"} alt={p.name} />
            <h3><Link href={`/pets/${p.pet_id}`}>{p.name}</Link> <span className={`badge ${p.adoption_status}`}>{p.adoption_status}</span></h3>
            <div className="meta">{p.breed || p.species} · {p.age} yr · {p.gender === "M" ? "Male" : p.gender === "F" ? "Female" : "Unknown"}</div>
            <div className="meta">{p.shelter_name}, {p.city}</div>
            <div>{p.temperament}</div>
          </div>
        ))}
      </div>
      <SqlBlock sql={listSql} params={params} />
      <SqlBlock sql={facetSql} />
    </>
  );
}
