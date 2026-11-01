/* Gemeinsame Helfer für den Foto-Upload beim Fahrzeugankauf (Cloudflare Pages Functions).
   Benötigt eine KV-Bindung mit dem Namen FOTOS (siehe README.md). */
export const TTL_DAYS = 60;                       // Fotos werden nach 60 Tagen automatisch gelöscht
export const TTL = TTL_DAYS * 24 * 60 * 60;
export const MAX_BYTES = 6 * 1024 * 1024;         // max. 6 MB pro Foto (die Seite verkleinert vorher auf ~0,5 MB)
export const MAX_PHOTOS = 10;
export const ID_RE = /^[A-Za-z0-9_-]{16,48}$/;

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" }
  });
}

export function randomId(bytes = 18) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Nur Anfragen von der eigenen Website annehmen
export function sameOrigin(request) {
  const host = new URL(request.url).host;
  const origin = request.headers.get("Origin") || request.headers.get("Referer") || "";
  try { return new URL(origin).host === host; } catch (e) { return false; }
}

// Echte Bilddatei? (Dateisignatur prüfen)
export function sniffImage(buf) {
  const b = new Uint8Array(buf.slice(0, 12));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}
