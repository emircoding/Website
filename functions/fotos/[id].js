/* GET /fotos/<id> → Fotomappe einer Ankauf-Anfrage (Link steht in der WhatsApp-/E-Mail-Nachricht) */
import { ID_RE, TTL_DAYS } from "../_shared.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function page(title, body, status = 200) {
  return new Response(`<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow"><meta name="referrer" content="no-referrer">
<title>${esc(title)} – Automobilzentrum Nagold</title>
<style>
:root{--ink:#0b0b0c;--paper:#ecebe8;--mute:#6d6d72}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,"Segoe UI",Inter,Arial,sans-serif;background:var(--paper);color:var(--ink)}
header{background:var(--ink);color:#fff;padding:18px 20px calc(18px + env(safe-area-inset-top,0)) ;}
header b{font-size:18px;letter-spacing:-.02em}header span{display:block;color:#9b9ba0;font-size:13px;margin-top:4px}
main{max-width:1200px;margin:0 auto;padding:20px 16px 40px}
h1{font-size:26px;margin:6px 0 4px;letter-spacing:-.02em}p{color:var(--mute);margin:0 0 18px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.grid a{display:block;border-radius:8px;overflow:hidden;background:#ddd;aspect-ratio:4/3}
.grid img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s}
.grid a:hover img{transform:scale(1.04)}
</style></head><body><header><b>Automobilzentrum Nagold</b><span>Fahrzeugankauf · Fotomappe</span></header><main>${body}</main></body></html>`, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" }
  });
}

export async function onRequestGet({ params, env }) {
  const id = String(params.id || "");
  if (!env.FOTOS || !ID_RE.test(id)) return page("Nicht gefunden", "<h1>Nicht gefunden</h1><p>Diese Fotomappe existiert nicht.</p>", 404);
  const album = await env.FOTOS.get("album:" + id, { type: "json" });
  if (!album || !album.photos) {
    return page("Nicht verfügbar", `<h1>Nicht verfügbar</h1><p>Diese Fotomappe ist nicht (mehr) verfügbar. Fotos werden nach ${TTL_DAYS} Tagen automatisch gelöscht.</p>`, 404);
  }
  const imgs = album.photos.map((p, i) => `<a href="/api/foto/${esc(p)}" target="_blank" rel="noopener"><img src="/api/foto/${esc(p)}" alt="Foto ${i + 1}" loading="lazy"></a>`).join("");
  const date = album.created ? new Date(album.created).toLocaleDateString("de-DE") : "";
  return page(album.title || "Fotomappe", `<h1>${esc(album.title || "Fahrzeugfotos")}</h1><p>${album.photos.length} Foto${album.photos.length === 1 ? "" : "s"}${date ? " · eingegangen am " + esc(date) : ""} · wird nach ${TTL_DAYS} Tagen automatisch gelöscht. Zum Vergrößern antippen.</p><div class="grid">${imgs}</div>`);
}
