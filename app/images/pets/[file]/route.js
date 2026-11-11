export async function GET(request, { params }) {
  const { file } = await params;
  let h = 0;
  for (const ch of file) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const label = file.replace(/\.[a-z]+$/i, "").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260"><rect width="400" height="260" fill="hsl(${h},60%,86%)"/><text x="200" y="125" font-size="70" text-anchor="middle">🐾</text><text x="200" y="190" font-size="22" text-anchor="middle" font-family="sans-serif" fill="hsl(${h},40%,30%)">${label}</text></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
