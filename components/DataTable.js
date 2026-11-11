export default function DataTable({ rows }) {
  if (!rows || rows.length === 0) return <p className="meta">No rows.</p>;
  const cols = Object.keys(rows[0]);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{cols.map((c) => <td key={c}>{r[c] === null || r[c] === undefined ? "—" : String(r[c])}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
