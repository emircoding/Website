/* GET  /api/fotos  → ist der Foto-Upload eingerichtet?
   POST /api/fotos  → ein Foto speichern (Body = Bilddatei), Antwort { id } */
import { json, randomId, sameOrigin, sniffImage, TTL, MAX_BYTES } from "../_shared.js";

export async function onRequestGet({ env }) {
  return json({ enabled: !!env.FOTOS });
}

export async function onRequestPost({ request, env }) {
  if (!env.FOTOS) return json({ error: "not_configured" }, 503);
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  const len = Number(request.headers.get("Content-Length") || 0);
  if (len > MAX_BYTES) return json({ error: "too_large" }, 413);
  const buf = await request.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) return json({ error: "too_large" }, 413);
  const type = sniffImage(buf);
  if (!type) return json({ error: "unsupported_type" }, 415);
  const id = randomId();
  await env.FOTOS.put("img:" + id, buf, { expirationTtl: TTL, metadata: { type } });
  return json({ id });
}
