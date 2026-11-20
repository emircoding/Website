/* ==========================================================================
   Fahrzeugfotos von mobile.de über die eigene Domain ausliefern
   GET /api/bild?u=<Bildadresse bei mobile.de>
   --------------------------------------------------------------------------
   So baut der Browser der Besucher keine Verbindung zu mobile.de auf
   (Datenschutz, kein Cookie-Banner nötig). Nur Bildserver von mobile.de
   sind erlaubt – keine offene Weiterleitung.
   ========================================================================== */

const ALLOWED = /(^|\.)(classistatic\.de|mobile\.de)$/i;

export async function onRequestGet({ request }) {
  const raw = new URL(request.url).searchParams.get("u") || "";
  let target;
  try { target = new URL(raw); } catch (_) { return new Response("Ungültige Bildadresse", { status: 400 }); }
  if (target.protocol !== "https:" || !ALLOWED.test(target.hostname)) return new Response("Nicht erlaubt", { status: 403 });

  let r;
  try {
    r = await fetch(target.toString(), {
      headers: { Accept: "image/avif,image/webp,image/jpeg,image/*;q=0.8" },
      cf: { cacheEverything: true, cacheTtl: 30 * 86400 }
    });
  } catch (_) {
    return new Response(null, { status: 502 });
  }
  const type = r.headers.get("Content-Type") || "";
  if (!r.ok || !/^image\//i.test(type)) return new Response(null, { status: r.status === 404 ? 404 : 502 });

  return new Response(r.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
