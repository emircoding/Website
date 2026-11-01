/* ==========================================================================
   Cloudflare Pages Function:  GET /api/fahrzeuge
   Lädt den Fahrzeugbestand live von der mobile.de Search-API und liefert
   ihn im Format, das die Website versteht.

   Einrichtung (einmalig, im Cloudflare-Dashboard):
   Workers & Pages → Projekt → Settings → Variables and Secrets:
     MOBILE_DE_USER              API-Benutzername (von mobile.de)
     MOBILE_DE_PASSWORD          API-Passwort (als „Secret“ anlegen)
     MOBILE_DE_CUSTOMER_NUMBER   Händler-Kundennummer bei mobile.de
   Danach einmal neu deployen. Solange die Werte fehlen, zeigt die Website
   automatisch die Demo-Fahrzeuge an.
   ========================================================================== */

const API = "https://services.mobile.de/search-api/search";
const CACHE_SECONDS = 600; // Bestand max. alle 10 Minuten neu von mobile.de holen

const FUEL = {
  PETROL: "Benzin", DIESEL: "Diesel", ELECTRICITY: "Elektro", HYBRID: "Hybrid (Benzin/Elektro)",
  HYBRID_DIESEL: "Hybrid (Diesel/Elektro)", PLUGIN_HYBRID: "Plug-in-Hybrid", LPG: "Autogas (LPG)",
  CNG: "Erdgas (CNG)", HYDROGENIUM: "Wasserstoff", ETHANOL: "Ethanol", OTHER: "Sonstige"
};
const GEAR = { MANUAL_GEAR: "Schaltgetriebe", AUTOMATIC_GEAR: "Automatik", SEMIAUTOMATIC_GEAR: "Halbautomatik" };
const BODY = {
  Cabrio: "Cabrio", EstateCar: "Kombi", Limousine: "Limousine", OffRoad: "SUV / Geländewagen",
  SmallCar: "Kleinwagen", SportsCar: "Sportwagen / Coupé", Van: "Van / Kleinbus", OtherCar: "Sonstige"
};
const COLOR = {
  BLACK: ["Schwarz", "#16171a"], WHITE: ["Weiß", "#ebebe8"], GREY: ["Grau", "#5d6166"], SILVER: ["Silber", "#a7a9ac"],
  BLUE: ["Blau", "#1f3a68"], RED: ["Rot", "#9e1b22"], GREEN: ["Grün", "#2f4a35"], BROWN: ["Braun", "#5a4030"],
  BEIGE: ["Beige", "#c9b994"], YELLOW: ["Gelb", "#d9b320"], ORANGE: ["Orange", "#d0661c"], GOLD: ["Gold", "#a88a4a"],
  PURPLE: ["Violett", "#4a2f5e"]
};
const FEATURE = {
  NAVIGATION_SYSTEM: "Navigation", ELECTRIC_HEATED_SEATS: "Sitzheizung", PARKING_SENSORS: "Einparkhilfe",
  REAR_VIEW_CAM: "Rückfahrkamera", CRUISE_CONTROL: "Tempomat", BLUETOOTH: "Bluetooth", SUNROOF: "Schiebedach",
  PANORAMIC_GLASS_ROOF: "Panoramadach", LED_HEADLIGHTS: "LED-Scheinwerfer", XENON_HEADLIGHTS: "Xenon",
  AUTOMATIC_CLIMATISATION: "Klimaautomatik", MANUAL_CLIMATISATION: "Klimaanlage", TRAILER_COUPLING: "Anhängerkupplung",
  ALLOY_WHEELS: "Leichtmetallfelgen", HEAD_UP_DISPLAY: "Head-up-Display", KEYLESS_ENTRY: "Keyless",
  LANE_DEPARTURE_WARNING: "Spurhalteassistent", FULL_SERVICE_HISTORY: "Scheckheftgepflegt", FOUR_WHEEL_DRIVE: "Allrad",
  ADAPTIVE_CRUISE_CONTROL: "Abstandstempomat", STEERING_WHEEL_HEATING: "Lenkradheizung", AUXILIARY_HEATING: "Standheizung",
  CARPLAY: "Apple CarPlay", ANDROID_AUTO: "Android Auto", SPORT_SEATS: "Sportsitze", LEATHER_SEATS: "Ledersitze",
  NONSMOKER_VEHICLE: "Nichtraucher", WARRANTY: "Garantie", ELECTRIC_TAILGATE: "Elektr. Heckklappe"
};

function humanize(code) {
  if (FEATURE[code]) return FEATURE[code];
  return String(code).toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function imageUrl(img) {
  if (!img) return null;
  const direct = img.xxxl || img.xxl || img.xl || img.l;
  if (direct) return direct;
  let ref = img.ref || img.uri || img.url;
  if (!ref) return null;
  if (ref.endsWith("$_")) return ref + "27.JPG";             // ältere Bild-URLs
  if (ref.includes("{size}")) return ref.replace("{size}", "1024");
  if (/classistatic\.de/.test(ref) && !ref.includes("?")) return ref + "?rule=mo-1024.jpg";
  return ref.replace(/^http:/, "https:");
}

function firstReg(v) { // "201909" -> "09/2019"
  const m = /^(\d{4})-?(\d{2})/.exec(v || "");
  return m ? `${m[2]}/${m[1]}` : v || "";
}

function mapAd(ad) {
  const colorKey = ad.exteriorColor || "";
  const col = COLOR[colorKey] || [colorKey ? humanize(colorKey) : "", "#2a2a2e"];
  const priceObj = ad.price || {};
  const price = parseFloat(priceObj.consumerPriceGross || priceObj.consumerPriceAmount || priceObj.amount || 0);
  return {
    id: String(ad.mobileAdId || ad.id),
    make: ad.make || "",
    model: ad.model || "",
    variant: (ad.modelDescription || "").replace(new RegExp("^\\s*" + (ad.make || "") + "\\s*" + (ad.model || ""), "i"), "").trim(),
    price: Math.round(price) || null,
    firstReg: firstReg(ad.firstRegistration),
    mileage: ad.mileage != null ? Number(ad.mileage) : null,
    powerKw: ad.power != null ? Number(ad.power) : null,
    fuel: FUEL[ad.fuel] || (ad.fuel ? humanize(ad.fuel) : ""),
    gearbox: GEAR[ad.gearbox] || (ad.gearbox ? humanize(ad.gearbox) : ""),
    body: BODY[ad.category] || ad.category || "",
    color: ad.manufacturerColorName || col[0],
    colorHex: col[1],
    owners: ad.numberOfPreviousOwners != null ? Number(ad.numberOfPreviousOwners) : null,
    features: (ad.features || []).map(humanize),
    description: ad.description || ad.enrichedDescription || "",
    images: (ad.images || []).map(imageUrl).filter(Boolean),
    url: ad.detailPageUrl || "",
    created: ad.creationDate || ad.modificationDate || ""
  };
}

async function fetchAll(env) {
  const auth = "Basic " + btoa(`${env.MOBILE_DE_USER}:${env.MOBILE_DE_PASSWORD}`);
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const q = new URLSearchParams({ "page.number": String(page), "page.size": "100" });
    if (env.MOBILE_DE_CUSTOMER_NUMBER) q.set("customerNumber", env.MOBILE_DE_CUSTOMER_NUMBER);
    const res = await fetch(`${API}?${q}`, {
      headers: { Authorization: auth, Accept: "application/vnd.de.mobile.api+json", "Accept-Language": "de" }
    });
    if (!res.ok) throw new Error(`mobile.de antwortet mit Status ${res.status}`);
    const data = await res.json();
    const ads = data.ads || data["search-result"]?.ads || [];
    all.push(...ads.map(mapAd));
    const total = Number(data.total || data.totalResultCount || 0);
    if (!ads.length || all.length >= total) break;
  }
  // Neueste zuerst; die 4 neuesten werden als „Highlight“ auf der Startseite gezeigt
  all.sort((a, b) => String(b.created).localeCompare(String(a.created)));
  all.forEach((v, i) => { v.highlight = i < 4; v.badge = i < 4 ? "Neu im Bestand" : ""; });
  return all;
}

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", ...extra }
  });

export async function onRequestGet({ request, env, waitUntil }) {
  if (!env.MOBILE_DE_USER || !env.MOBILE_DE_PASSWORD) {
    return json({ source: "demo", vehicles: [], hint: "mobile.de-Zugangsdaten noch nicht hinterlegt" }, 200, { "Cache-Control": "no-store" });
  }

  const cache = caches.default;
  const key = new Request(new URL("/api/fahrzeuge?v=1", request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;

  try {
    const vehicles = await fetchAll(env);
    const res = json({ source: "mobile.de", updated: new Date().toISOString(), count: vehicles.length, vehicles }, 200, {
      "Cache-Control": `public, max-age=60, s-maxage=${CACHE_SECONDS}`
    });
    waitUntil(cache.put(key, res.clone()));
    return res;
  } catch (err) {
    return json({ source: "error", error: String(err.message || err), vehicles: [] }, 502, { "Cache-Control": "no-store" });
  }
}
