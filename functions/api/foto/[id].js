/* GET /api/foto/<id> → gespeichertes Foto ausliefern */
import { ID_RE } from "../../_shared.js";

export async function onRequestGet({ params, env }) {
  const id = String(params.id || "");
  if (!env.FOTOS || !ID_RE.test(id)) return new Response("Nicht gefunden", { status: 404 });
  const { value, metadata } = await env.FOTOS.getWithMetadata("img:" + id, { type: "arrayBuffer" });
  if (!value) return new Response("Dieses Foto ist nicht mehr verfügbar.", { status: 404 });
  return new Response(value, {
    headers: {
      "Content-Type": (metadata && metadata.type) || "image/jpeg",
      "Cache-Control": "private, max-age=86400",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
