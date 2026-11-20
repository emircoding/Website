/* ==========================================================================
   Fahrzeugbestand live von mobile.de  →  GET /api/fahrzeuge
   --------------------------------------------------------------------------
   Holt den Bestand über die offizielle mobile.de Search-API
   („Inserats-Einbindung“) und liefert ihn als schlankes JSON an die Seite
   „Fahrzeuge“. Neue Inserate erscheinen automatisch, gelöschte/verkaufte
   verschwinden automatisch – spätestens nach FRESH Sekunden.

   Einrichtung (einmalig) in Cloudflare → Workers & Pages → Projekt →
   Einstellungen → Variablen und Geheimnisse (Typ „Secret“/verschlüsselt):
     MOBILE_DE_USER              API-Benutzername von mobile.de
     MOBILE_DE_PASSWORD          API-Passwort von mobile.de
     MOBILE_DE_CUSTOMER_NUMBER   (optional) Kundennummer des Händlers
   Danach einmal neu bereitstellen (Deployments → „Retry deployment“).

   Die Zugangsdaten stehen NICHT im Code und NICHT auf GitHub.
   ========================================================================== */

const FRESH = 600;              // 10 Minuten: so oft wird bei mobile.de nachgesehen
const BACKUP = 14 * 86400;      // Notfall-Kopie, falls mobile.de kurz nicht erreichbar ist
const MAX_DETAILS = 30;         // max. Detail-Abrufe pro Aktualisierung (Cloudflare-Limit)
const CACHE_VERSION = "v1";

export async function onRequestGet(ctx) {
  const { env, request } = ctx;
  const user = String(env.MOBILE_DE_USER || "").trim();
  const pass = String(env.MOBILE_DE_PASSWORD || "");
  if (!user || !pass) return reply({ ok: false, reason: "not_configured", ads: [] }, 60);

  const base = String(env.MOBILE_DE_API_BASE || "https://services.mobile.de").replace(/\/+$/, "");
  const origin = new URL(request.url).origin;
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const kFresh = new Request(origin + "/__mde-cache/" + CACHE_VERSION + "/fresh");
  const kBackup = new Request(origin + "/__mde-cache/" + CACHE_VERSION + "/backup");

  if (cache) {
    const hit = await cache.match(kFresh);
    if (hit) return reply(await hit.json(), 120, 200, "HIT");
  }

  let previous = null;
  if (cache) {
    const b = await cache.match(kBackup);
    if (b) previous = await b.json().catch(() => null);
  }

  try {
    const data = await load(base, user, pass, env.MOBILE_DE_CUSTOMER_NUMBER, previous);
    if (cache) {
      const body = JSON.stringify(data);
      const put = (key, ttl) => cache.put(key, new Response(body, {
        headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=" + ttl }
      }));
      ctx.waitUntil(Promise.all([put(kFresh, FRESH), put(kBackup, BACKUP)]));
    }
    return reply(data, 120, 200, "MISS");
  } catch (e) {
    // mobile.de gerade nicht erreichbar → letzten bekannten Stand zeigen statt leerer Seite
    if (previous && previous.ok) return reply(Object.assign({}, previous, { stale: true }), 60, 200, "STALE");
    return reply({ ok: false, reason: e.code || "error", message: String(e.message || e).slice(0, 200), ads: [] }, 30, 200, "ERROR");
  }
}

/* ---------- mobile.de abfragen ---------- */
async function load(base, user, pass, customerNumber, previous) {
  const headers = {
    Authorization: "Basic " + b64(user + ":" + pass),
    Accept: "application/vnd.de.mobile.api+json",
    "User-Agent": "Website-Fahrzeugbestand/1.0"
  };
  const numbers = String(customerNumber || "").split(/[\s,;]+/).filter((n) => /^\d+$/.test(n));

  // 1) Alle Inserate (seitenweise, je 100)
  const raw = [];
  let page = 1, maxPages = 1;
  do {
    const q = new URLSearchParams({ "page.size": "100", "page.number": String(page) });
    numbers.forEach((n) => q.append("customerNumber", n));
    const r = await fetch(base + "/search-api/search?" + q.toString(), { headers });
    if (r.status === 401 || r.status === 403) throw fail("auth", "mobile.de hat die Zugangsdaten abgelehnt (HTTP " + r.status + ")");
    if (!r.ok) throw fail("upstream", "mobile.de antwortet mit HTTP " + r.status);
    const j = await r.json();
    // Ohne Kundennummer darf das Konto nur den eigenen Bestand sehen – sonst lieber abbrechen
    if (page === 1 && !numbers.length && (j.total || 0) > 1500) throw fail("needs_customer_number", "Bitte MOBILE_DE_CUSTOMER_NUMBER eintragen");
    (j.ads || []).forEach((a) => raw.push(a));
    maxPages = Math.min(Number(j.maxPages) || 1, 20);
    page++;
  } while (page <= maxPages);

  // 2) Fotos & Details: Suchergebnisse enthalten weniger Felder als das einzelne Inserat.
  //    Bereits bekannte, unveränderte Inserate werden aus dem letzten Stand übernommen.
  const known = new Map();
  if (previous && Array.isArray(previous.ads)) previous.ads.forEach((a) => known.set(a.id + "|" + a.modified, a));

  const out = [];
  const todo = [];
  raw.forEach((a, i) => {
    const prev = known.get(String(a.mobileAdId) + "|" + (a.modificationDate || ""));
    if (prev && prev.full) out[i] = prev;
    else todo.push(i);
  });

  let budget = MAX_DETAILS;
  await pool(todo, 6, async (i) => {
    let a = raw[i], full = false;
    if (budget > 0) {
      budget--;
      try {
        const r = await fetch(base + "/search-api/ad/" + encodeURIComponent(a.mobileAdId), { headers });
        if (r.ok) { a = Object.assign({}, a, await r.json()); full = true; }
      } catch (_) { /* Suchdaten reichen notfalls */ }
    }
    out[i] = norm(a, full);
  });

  const ads = out.filter(Boolean).sort((x, y) => String(y.created || "").localeCompare(String(x.created || "")));
  return { ok: true, updated: new Date().toISOString(), count: ads.length, ads };
}

/* ---------- Inserat → schlankes Format für die Website ---------- */
function norm(a, full) {
  const p = a.price || {};
  const img = (u) => (u ? "/api/bild?u=" + encodeURIComponent(u) : "");
  const images = (Array.isArray(a.images) ? a.images : []).map((i) => ({
    s: img(i.l || i.m || i.s),
    m: img(i.xl || i.l || i.m),
    l: img(i.xxl || i.xl || i.l),
    xl: img(i.xxxl || i.xxl || i.xl)
  })).filter((i) => i.m).slice(0, 40);

  const em = a.emissions && a.emissions.combined ? a.emissions.combined : {};
  const cons = a.consumptions && a.consumptions.fuel ? a.consumptions.fuel : {};
  const consPower = a.consumptions && a.consumptions.power ? a.consumptions.power : {};

  return {
    id: String(a.mobileAdId || ""),
    full: !!full,
    created: a.creationDate || "",
    modified: a.modificationDate || "",
    make: a.make || "",
    model: a.model || "",
    title: a.modelDescription || "",
    category: a.category || "",
    condition: a.condition || "",
    usage: a.usageType || "",
    firstReg: a.firstRegistration || "",
    km: num(a.mileage),
    fuel: a.fuel || "",
    plugin: !!a.hybridPlugin,
    gearbox: a.gearbox || "",
    kw: num(a.power),
    ccm: num(a.cubicCapacity),
    battery: num(a.batteryCapacity),
    range: num(a.range),
    color: a.exteriorColor || "",
    colorName: a.manufacturerColorName || "",
    metallic: !!a.metallic,
    doors: a.doors || "",
    seats: num(a.seats),
    owners: num(a.numberOfPreviousOwners),
    hu: a.generalInspection || "",
    newHu: !!a.newHuAu,
    accident: a.accidentDamaged === true ? "yes" : a.accidentDamaged === false ? "no" : "",
    damaged: !!a.damageUnrepaired,
    service: !!a.fullServiceHistory,
    nonSmoker: !!a.nonSmokerVehicle,
    emissionClass: a.emissionClass || "",
    climate: a.climatisation || "",
    co2: em.co2 || (a.co2 != null ? String(a.co2) : ""),
    co2Class: em.co2Class || "",
    consumption: cons.combined || (a.consumptionCombined != null ? String(a.consumptionCombined) : ""),
    consumptionPower: consPower.combined || (a.consumptionPowerCombined != null ? String(a.consumptionPowerCombined) : ""),
    features: features(a),
    price: num(p.consumerPriceGross),
    priceNet: num(p.consumerPriceNet),
    vat: p.vatRate != null && p.vatRate !== "",
    priceType: p.type || "",
    rating: a.priceRating && a.priceRating.label ? a.priceRating.label : "",
    description: String(a.plainTextDescription || "").slice(0, 4000),
    url: a.detailPageUrl || "",
    images
  };
}

const FEATURES = [
  ["navigationSystem", "Navigationssystem"], ["carplay", "Apple CarPlay"], ["androidAuto", "Android Auto"],
  ["bluetooth", "Bluetooth"], ["handsFreePhoneSystem", "Freisprecheinrichtung"], ["digitalCockpit", "Digitales Cockpit"],
  ["headUpDisplay", "Head-up-Display"], ["onBoardComputer", "Bordcomputer"], ["multifunctionalWheel", "Multifunktionslenkrad"],
  ["leatherSteeringWheel", "Lederlenkrad"], ["heatedSteeringWheel", "Lenkradheizung"], ["electricHeatedSeats", "Sitzheizung"],
  ["ventilatedSeats", "Sitzbelüftung"], ["electricAdjustableSeats", "Elektrische Sitze"], ["memorySeats", "Memory-Sitze"],
  ["massageSeats", "Massagesitze"], ["sportSeats", "Sportsitze"], ["sportPackage", "Sportpaket"],
  ["panoramicGlassRoof", "Panorama-Glasdach"], ["sunroof", "Schiebedach"], ["alloyWheels", "Leichtmetallfelgen"],
  ["keylessEntry", "Keyless Entry"], ["electricTailgate", "Elektrische Heckklappe"], ["ambientLighting", "Ambientebeleuchtung"],
  ["soundSystem", "Soundsystem"], ["wirelessCharging", "Induktives Laden"], ["laneDepartureWarning", "Spurhalteassistent"],
  ["blindSpotMonitor", "Totwinkel-Assistent"], ["distanceWarningSystem", "Abstandswarner"], ["collisionAvoidance", "Notbremsassistent"],
  ["trafficSignRecognition", "Verkehrszeichenerkennung"], ["highBeamAssist", "Fernlichtassistent"], ["hillStartAssist", "Berganfahrassistent"],
  ["auxiliaryHeating", "Standheizung"], ["airSuspension", "Luftfederung"], ["isofix", "Isofix"],
  ["lightSensor", "Lichtsensor"], ["automaticRainSensor", "Regensensor"], ["tirePressureMonitoring", "Reifendruckkontrolle"],
  ["startStopSystem", "Start-Stopp-Automatik"], ["electricExteriorMirrors", "Elektrische Außenspiegel"], ["roofRails", "Dachreling"],
  ["winterTires", "Winterreifen"], ["allSeasonTires", "Ganzjahresreifen"], ["esp", "ESP"], ["abs", "ABS"]
];
function features(a) {
  const list = [];
  const climate = { AUTOMATIC_CLIMATISATION: "Klimaautomatik", AUTOMATIC_CLIMATISATION_2_ZONES: "2-Zonen-Klimaautomatik", AUTOMATIC_CLIMATISATION_3_ZONES: "3-Zonen-Klimaautomatik", AUTOMATIC_CLIMATISATION_4_ZONES: "4-Zonen-Klimaautomatik", MANUAL_CLIMATISATION: "Klimaanlage" }[a.climatisation];
  if (climate) list.push(climate);
  if (a.speedControl === "ADAPTIVE_CRUISE_CONTROL") list.push("Abstandstempomat (ACC)");
  else if (a.speedControl === "CRUISE_CONTROL") list.push("Tempomat");
  if (Array.isArray(a.parkingAssistants) && a.parkingAssistants.length) {
    const pa = a.parkingAssistants.map(String);
    if (pa.some((x) => /CAM_360|360/.test(x))) list.push("360°-Kamera");
    else if (pa.some((x) => /CAM/.test(x))) list.push("Rückfahrkamera");
    if (pa.some((x) => /SELF_STEERING|AUTO/.test(x))) list.push("Parklenkassistent");
    if (pa.some((x) => /SENSORS/.test(x))) list.push("Einparkhilfe");
  }
  if (/LED/.test(String(a.headlightType || ""))) list.push("LED-Scheinwerfer");
  else if (/XENON/.test(String(a.headlightType || ""))) list.push("Xenon-Scheinwerfer");
  if (a.trailerCouplingType) list.push("Anhängerkupplung");
  FEATURES.forEach(([k, label]) => { if (a[k] === true) list.push(label); });
  return Array.from(new Set(list)).slice(0, 40);
}

/* ---------- Hilfsfunktionen ---------- */
function reply(data, maxAge, status, cacheState) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=" + (maxAge || 60),
      "X-Bestand-Cache": cacheState || "-",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
function fail(code, message) { const e = new Error(message); e.code = code; return e; }
function num(v) { const n = parseFloat(v); return isFinite(n) ? n : null; }
function b64(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}
async function pool(items, size, fn) {
  let i = 0;
  const run = async () => { while (i < items.length) { const k = i++; await fn(items[k]); } };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, run));
}
