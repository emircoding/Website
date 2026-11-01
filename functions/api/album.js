/* POST /api/album  { id, photos: [fotoId, …] } → Fotomappe für eine Ankauf-Anfrage speichern */
import { json, sameOrigin, TTL, MAX_PHOTOS, ID_RE } from "../_shared.js";

export async function onRequestPost({ request, env }) {
  if (!env.FOTOS) return json({ error: "not_configured" }, 503);
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "bad_request" }, 400); }
  const id = String(body && body.id || "");
  const photos = Array.isArray(body && body.photos) ? body.photos.map(String) : [];
  if (!ID_RE.test(id) || !photos.length || photos.length > MAX_PHOTOS || !photos.every((p) => ID_RE.test(p))) {
    return json({ error: "bad_request" }, 400);
  }
  const title = String(body.title || "").slice(0, 120);
  await env.FOTOS.put("album:" + id, JSON.stringify({ photos, title, created: new Date().toISOString() }), { expirationTtl: TTL });
  return json({ ok: true });
}
