export default function SqlBlock({ sql, params }) {
  return (
    <details className="sql">
      <summary>View embedded SQL</summary>
      <pre>
        {sql}
        {params && params.length > 0 ? "\n-- params: " + JSON.stringify(params) : ""}
      </pre>
    </details>
  );
}
