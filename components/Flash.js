export default function Flash({ sp }) {
  if (!sp) return null;
  return (
    <>
      {sp.msg ? <div className="flash ok">{sp.msg}</div> : null}
      {sp.err ? <div className="flash err">{sp.err}</div> : null}
    </>
  );
}
