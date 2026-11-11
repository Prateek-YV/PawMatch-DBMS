import Link from "next/link";
import { pool } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { safeMongo } from "@/lib/mongo";
import Flash from "@/components/Flash";
import SqlBlock from "@/components/SqlBlock";
import { savePreferences, refreshMatches } from "./actions";

export default async function Recommendations({ searchParams }) {
  const sp = await searchParams;
  const user = await requireUser(["adopter"]);

  const profSql = "SELECT housing_type, has_yard, household_size FROM adopter_profile WHERE user_id = ?";
  const [[profile]] = await pool.query(profSql, [user.user_id]);
  const prefs = await safeMongo((db) => db.collection("user_preferences").findOne({ user_id: user.user_id }, { projection: { _id: 0 } }), null);
  const activity = await safeMongo((db) => db.collection("user_activity").find({ user_id: user.user_id }).sort({ ts: -1 }).limit(8).toArray(), []);

  const matchSql = "CALL sp_top_matches(?, ?)";
  const [matchRes] = await pool.query(matchSql, [user.user_id, 10]);
  const matches = matchRes[0] || [];

  const species = prefs?.preferred_species || ["Dog"];
  const sizes = prefs?.preferred_sizes || [];
  const housing = prefs?.housing || profile?.housing_type || "house";
  const hasYard = prefs ? prefs.has_yard : profile?.has_yard === "Y";

  return (
    <>
      <h1>My matches</h1>
      <p className="sub">Your preferences live in MongoDB. Matching compares them with each pet&apos;s profile vector (cosine similarity) plus shared traits, then stores the scores in MySQL.</p>
      <Flash sp={sp} />

      <div className="two-col">
        <div>
          <h2 style={{ marginTop: 0 }}>Your preferences</h2>
          <form action={savePreferences} className="card">
            <label>Species you like</label>
            <div className="inline">
              {["Dog", "Cat", "Rabbit"].map((s) => (<label key={s}><input type="checkbox" name="species" value={s} defaultChecked={species.includes(s)} /> {s}</label>))}
            </div>
            <label>Sizes (leave empty for any)</label>
            <div className="inline">
              {["small", "medium", "large"].map((s) => (<label key={s}><input type="checkbox" name="sizes" value={s} defaultChecked={sizes.includes(s)} /> {s}</label>))}
            </div>
            <div className="grid cols-2">
              <div><label>Energy you want (1 calm - 5 very active)</label><input name="desired_energy" type="number" min="1" max="5" defaultValue={prefs?.desired_energy || 3} /></div>
              <div>
                <label>Experience with pets</label>
                <select name="experience_level" defaultValue={prefs?.experience_level || "beginner"}>
                  <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="experienced">Experienced</option>
                </select>
              </div>
              <div>
                <label>Housing</label>
                <select name="housing" defaultValue={housing}><option value="house">House</option><option value="apartment">Apartment</option><option value="farm">Farm</option><option value="other">Other</option></select>
              </div>
              <div><label>Personality you want (comma separated)</label><input name="wanted_traits" defaultValue={(prefs?.wanted_traits || []).join(", ")} placeholder="calm, playful, friendly" /></div>
            </div>
            <div className="inline" style={{ marginTop: 10 }}>
              <label><input type="checkbox" name="has_kids" defaultChecked={Boolean(prefs?.has_kids)} /> I have children</label>
              <label><input type="checkbox" name="has_other_pets" defaultChecked={Boolean(prefs?.has_other_pets)} /> I have other pets</label>
              <label><input type="checkbox" name="has_yard" defaultChecked={hasYard} /> I have a yard</label>
            </div>
            <p><button>Save preferences</button></p>
          </form>
          <SqlBlock sql={profSql} params={[user.user_id]} />
        </div>

        <div>
          <h2 style={{ marginTop: 0 }}>Recommended pets</h2>
          <form action={refreshMatches}><button className="good">Find my matches</button></form>
          {matches.length === 0 ? <p className="meta">No stored matches yet.</p> : (
            <div className="table-wrap" style={{ marginTop: 12 }}><table><thead><tr><th>Pet</th><th>Species</th><th>Breed</th><th>Shelter</th><th>Score</th></tr></thead><tbody>
              {matches.map((m) => (<tr key={m.pet_id}><td><Link href={`/pets/${m.pet_id}`}>{m.pet_name}</Link></td><td>{m.species}</td><td>{m.breed}</td><td>{m.shelter_name}</td><td><strong>{m.match_score}</strong></td></tr>))}
            </tbody></table></div>
          )}
          <SqlBlock sql={matchSql} params={[user.user_id, 10]} />

          <h2>Recent activity (MongoDB)</h2>
          {activity.length === 0 ? <p className="meta">No activity recorded.</p> : (
            <div className="table-wrap"><table><thead><tr><th>When</th><th>Action</th><th>Pet</th></tr></thead><tbody>
              {activity.map((a) => (<tr key={String(a._id)}><td>{new Date(a.ts).toISOString().slice(0, 16).replace("T", " ")}</td><td>{a.action}</td><td>{a.pet_id || "—"}</td></tr>))}
            </tbody></table></div>
          )}
        </div>
      </div>
    </>
  );
}
