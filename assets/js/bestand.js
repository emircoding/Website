/* ==========================================================================
   Automobilzentrum Nagold – Fahrzeugbestand (live von mobile.de)
   Lädt /api/fahrzeuge (Cloudflare Pages Function) und zeigt eigene
   Fahrzeugkarten mit Filter, Sortierung und Detailansicht mit Fotogalerie.
   Neue Inserate auf mobile.de erscheinen automatisch, gelöschte verschwinden.
   ========================================================================== */
(function () {
  "use strict";
  var C = window.AZN_CONFIG || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var API = "/api/fahrzeuge";
  var NEW_DAYS = 14;

  /* ---------- Übersetzungen der mobile.de-Werte ---------- */
  var FUEL = { PETROL: "Benzin", DIESEL: "Diesel", ELECTRICITY: "Elektro", HYBRID: "Hybrid (Benzin/Elektro)", HYBRID_DIESEL: "Hybrid (Diesel/Elektro)", LPG: "Autogas (LPG)", CNG: "Erdgas (CNG)", ETHANOL: "Ethanol", HYDROGENIUM: "Wasserstoff", OTHER: "Sonstige" };
  var GEAR = { MANUAL_GEAR: "Schaltgetriebe", SEMIAUTOMATIC_GEAR: "Halbautomatik", AUTOMATIC_GEAR: "Automatik" };
  var CAT = { Cabrio: "Cabrio / Roadster", EstateCar: "Kombi", Limousine: "Limousine", OffRoad: "SUV / Geländewagen", SmallCar: "Kleinwagen", SportsCar: "Sportwagen / Coupé", Van: "Van / Kleinbus", OtherCar: "Sonstige" };
  var COLOR = { BLACK: "Schwarz", WHITE: "Weiß", GREY: "Grau", SILVER: "Silber", BLUE: "Blau", RED: "Rot", GREEN: "Grün", BROWN: "Braun", BEIGE: "Beige", YELLOW: "Gelb", ORANGE: "Orange", GOLD: "Gold", PURPLE: "Violett" };
  var DOORS = { TWO_OR_THREE: "2/3", FOUR_OR_FIVE: "4/5", SIX_OR_SEVEN: "6/7" };
  var USAGE = { DEMONSTRATION: "Vorführfahrzeug", PRE_REGISTRATION: "Tageszulassung", EMPLOYEES_CAR: "Jahreswagen", CLASSIC: "Oldtimer" };
  var RATING = { VERY_GOOD_PRICE: "Sehr guter Preis", GOOD_PRICE: "Guter Preis", REASONABLE_PRICE: "Fairer Preis" };
  var MAKES = { "MERCEDES-BENZ": "Mercedes-Benz", VOLKSWAGEN: "Volkswagen", VW: "VW", BMW: "BMW", AUDI: "Audi", SKODA: "Škoda", CITROEN: "Citroën", SEAT: "SEAT", MINI: "MINI", KIA: "Kia", MG: "MG", DS: "DS", DS_AUTOMOBILES: "DS Automobiles", SMART: "smart", LAND_ROVER: "Land Rover", ROLLS_ROYCE: "Rolls-Royce", ALFA_ROMEO: "Alfa Romeo", ASTON_MARTIN: "Aston Martin", "LYNK_&_CO": "Lynk & Co" };

  var ICON = {
    cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.3l1.4-2h7.6l1.4 2h2.3A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.4 8.4 0 1 1 21 11.5z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" stroke-width="2.4" stroke-linecap="round"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    car: '<svg viewBox="0 0 64 40" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M6 28v-6l5-9a4 4 0 0 1 3.5-2h30a4 4 0 0 1 3.4 1.9L54 22h2a3 3 0 0 1 3 3v3"/><path d="M6 22h52"/><circle cx="17" cy="29" r="4.5"/><circle cx="47" cy="29" r="4.5"/></svg>'
  };

  /* ---------- Formatierung ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function n0(v) { return Math.round(v).toLocaleString("de-DE"); }
  function price(v) { return v ? n0(v) + " €" : "Preis auf Anfrage"; }
  function ym(s) { s = String(s || ""); return s.length >= 6 ? s.slice(4, 6) + "/" + s.slice(0, 4) : ""; }
  function make(m) {
    m = String(m || "");
    if (MAKES[m]) return MAKES[m];
    return m.replace(/_/g, " ").split(/([ -])/).map(function (w) { return w.length <= 3 && /^[A-Z]+$/.test(w) ? w : w.charAt(0) + w.slice(1).toLowerCase(); }).join("");
  }
  function title(a) {
    var t = String(a.title || "").trim() || String(a.model || "").replace(/_/g, " ");
    return t;
  }
  function fullName(a) { return (make(a.make) + " " + title(a)).trim(); }
  function fuel(a) { return a.plugin ? "Plug-in-Hybrid" : FUEL[a.fuel] || (a.fuel ? make(a.fuel) : ""); }
  function power(a) { return a.kw ? n0(a.kw) + " kW (" + n0(a.kw * 1.35962) + " PS)" : ""; }
  function emission(v) { var m = /^EURO(\d)(.*)$/.exec(String(v || "")); return m ? "Euro " + m[1] + m[2].replace(/_TEMP$/, "-TEMP").toLowerCase().replace("-temp", "-TEMP") : ""; }
  function isNew(a) { var t = Date.parse(a.created); return t && Date.now() - t < NEW_DAYS * 864e5; }
  function srcset(img) { var out = []; if (img.s) out.push(img.s + " 360w"); if (img.m) out.push(img.m + " 640w"); if (img.l) out.push(img.l + " 1024w"); return out.join(", "); }
  function consumptionUnit(a) { return a.fuel === "ELECTRICITY" ? " kWh/100 km" : a.fuel === "CNG" ? " kg/100 km" : " l/100 km"; }
  function envkv(a) {
    var parts = [];
    if (a.consumption) parts.push("Kraftstoffverbrauch kombiniert: " + String(a.consumption).replace(".", ",") + consumptionUnit(a));
    if (a.consumptionPower) parts.push("Stromverbrauch kombiniert: " + String(a.consumptionPower).replace(".", ",") + " kWh/100 km");
    if (a.co2) parts.push("CO₂-Emissionen kombiniert: " + String(a.co2).replace(".", ",") + " g/km");
    if (a.co2Class) parts.push("CO₂-Klasse: " + a.co2Class);
    return parts.join(" · ");
  }
  function specs(a) {
    return [a.firstReg ? "EZ " + ym(a.firstReg) : (a.condition === "NEW" ? "Neuwagen" : ""), a.km != null ? n0(a.km) + " km" : "", power(a), fuel(a), GEAR[a.gearbox] || ""].filter(Boolean);
  }
  function waText(a) {
    return "Hallo, ich interessiere mich für den " + fullName(a) + (a.price ? " (" + price(a.price) + ")" : "") + (a.firstReg ? ", EZ " + ym(a.firstReg) : "") + (a.km != null ? ", " + n0(a.km) + " km" : "") + ". Ist das Fahrzeug noch verfügbar?" + (a.url ? "\n" + a.url : "");
  }
  function waLink(a) { return "https://wa.me/" + (C.whatsapp || "") + "?text=" + encodeURIComponent(waText(a)); }

  /* ---------- Daten ---------- */
  var state = { ads: [], make: "", fuel: "", sort: "new" };
  function fetchStock() {
    return fetch(API, { headers: { Accept: "application/json" }, credentials: "omit" }).then(function (r) {
      var ct = r.headers.get("Content-Type") || "";
      if (!r.ok || ct.indexOf("json") < 0) throw new Error("http");
      return r.json();
    });
  }

  /* ---------- Karten ---------- */
  function card(a, i) {
    var img = a.images[0];
    var badges = [];
    if (isNew(a)) badges.push('<span class="car__badge car__badge--new">Neu eingetroffen</span>');
    if (RATING[a.rating]) badges.push('<span class="car__badge car__badge--deal">' + RATING[a.rating] + "</span>");
    if (USAGE[a.usage]) badges.push('<span class="car__badge">' + USAGE[a.usage] + "</span>");
    var env = a.condition === "NEW" ? envkv(a) : "";
    return '<article class="car" style="--i:' + Math.min(i, 11) + '" data-car="' + esc(a.id) + '">' +
      '<a class="car__media" href="#fz-' + esc(a.id) + '" aria-label="Details: ' + esc(fullName(a)) + '">' +
        (img ? '<img src="' + esc(img.m) + '" srcset="' + esc(srcset(img)) + '" sizes="(max-width: 720px) 92vw, (max-width: 1180px) 46vw, 30vw" alt="' + esc(fullName(a)) + '" loading="' + (i < 3 ? "eager" : "lazy") + '" decoding="async"' + (i < 3 ? ' fetchpriority="high"' : "") + ">" : '<span class="car__noimg">' + ICON.car + "<small>Fotos folgen</small></span>") +
        (a.images.length > 1 ? '<span class="car__count">' + ICON.cam + a.images.length + "</span>" : "") +
        (badges.length ? '<span class="car__badges">' + badges.join("") + "</span>" : "") +
      "</a>" +
      '<div class="car__body">' +
        '<span class="car__make">' + esc(make(a.make)) + "</span>" +
        '<h3 class="car__title"><a href="#fz-' + esc(a.id) + '">' + esc(title(a)) + "</a></h3>" +
        '<ul class="car__specs">' + specs(a).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>" +
        (env ? '<p class="car__envkv">' + esc(env) + "</p>" : "") +
        '<div class="car__foot">' +
          '<div class="car__price">' + esc(price(a.price)) + (a.vat ? "<small>MwSt. ausweisbar</small>" : "") + "</div>" +
          '<a class="car__more" href="#fz-' + esc(a.id) + '">Details ' + ICON.arrow + "</a>" +
        "</div>" +
      "</div>" +
    "</article>";
  }

  function filtered() {
    var list = state.ads.filter(function (a) {
      return (!state.make || a.make === state.make) && (!state.fuel || (a.plugin ? "PLUGIN" : a.fuel) === state.fuel);
    });
    var by = {
      "new": function (x, y) { return String(y.created).localeCompare(String(x.created)); },
      "price-asc": function (x, y) { return (x.price || 9e9) - (y.price || 9e9); },
      "price-desc": function (x, y) { return (y.price || 0) - (x.price || 0); },
      "km-asc": function (x, y) { return (x.km == null ? 9e9 : x.km) - (y.km == null ? 9e9 : y.km); },
      "year-desc": function (x, y) { return String(y.firstReg || "999999").localeCompare(String(x.firstReg || "999999")); }
    }[state.sort];
    return list.slice().sort(by);
  }

  function renderGrid(root) {
    var grid = root.querySelector("[data-stock-grid]");
    var list = filtered();
    grid.classList.remove("is-loading");
    grid.innerHTML = list.length ? list.map(card).join("") :
      '<div class="stock-none"><p>Für diese Auswahl ist gerade kein Fahrzeug im Bestand.</p><button class="link-arrow" type="button" data-stock-reset>Filter zurücksetzen</button></div>';
    var cnt = root.querySelector("[data-stock-count]");
    if (cnt) cnt.textContent = list.length === state.ads.length ? state.ads.length + (state.ads.length === 1 ? " Fahrzeug" : " Fahrzeuge") : list.length + " von " + state.ads.length;
    if (!reduce) requestAnimationFrame(function () { grid.querySelectorAll(".car").forEach(function (c) { c.classList.add("is-in"); }); });
    else grid.querySelectorAll(".car").forEach(function (c) { c.classList.add("is-in"); });
  }

  function buildFilters(root) {
    var selMake = root.querySelector("[data-stock-make]"), selFuel = root.querySelector("[data-stock-fuel]"), selSort = root.querySelector("[data-stock-sort]");
    var makes = {}, fuels = {};
    state.ads.forEach(function (a) { makes[a.make] = (makes[a.make] || 0) + 1; var f = a.plugin ? "PLUGIN" : a.fuel; if (f) fuels[f] = (fuels[f] || 0) + 1; });
    var mk = Object.keys(makes).filter(Boolean).sort(function (x, y) { return make(x).localeCompare(make(y), "de"); });
    selMake.innerHTML = '<option value="">Alle Marken</option>' + mk.map(function (m) { return '<option value="' + esc(m) + '">' + esc(make(m)) + " (" + makes[m] + ")</option>"; }).join("");
    var fk = Object.keys(fuels);
    selFuel.innerHTML = '<option value="">Alle Kraftstoffe</option>' + fk.map(function (f) { return '<option value="' + esc(f) + '">' + esc(f === "PLUGIN" ? "Plug-in-Hybrid" : FUEL[f] || f) + " (" + fuels[f] + ")</option>"; }).join("");
    selMake.closest(".stock-select").hidden = mk.length < 2;
    selFuel.closest(".stock-select").hidden = fk.length < 2;
    root.querySelector(".stock-bar__tools").hidden = false;
    function upd() { state.make = selMake.value; state.fuel = selFuel.value; state.sort = selSort.value; renderGrid(root); }
    [selMake, selFuel, selSort].forEach(function (s) { s.addEventListener("change", upd); });
    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-stock-reset]")) { selMake.value = ""; selFuel.value = ""; upd(); }
    });
  }

  function fallback(root, kind) {
    var grid = root.querySelector("[data-stock-grid]");
    grid.classList.remove("is-loading");
    root.querySelector("[data-stock-count]").textContent = kind === "empty" ? "0 Fahrzeuge" : "Bestand";
    var live = root.querySelector(".stock-bar .mde-frame__live"); if (live && kind !== "empty") live.hidden = true;
    var mde = C.mobileDeUrl || "";
    grid.innerHTML = '<div class="stock-fallback">' +
      '<span class="mde__logo">mobile<b>.de</b></span>' +
      (kind === "empty"
        ? "<h3>Gerade ist alles verkauft.</h3><p>Neue Fahrzeuge treffen laufend ein und erscheinen hier automatisch. Sagen Sie uns, was Sie suchen – wir melden uns, sobald es da ist.</p>"
        : "<h3>Unser kompletter Bestand auf mobile.de.</h3><p>Alle Fahrzeuge mit Fotos, Ausstattung und Preis finden Sie direkt auf unserer Händlerseite bei mobile.de. Oder fragen Sie uns einfach – wir sagen Ihnen gern, was gerade bei uns steht.</p>") +
      '<div class="stock-fallback__actions">' +
        (mde && kind !== "empty" ? '<a class="btn" href="' + esc(mde) + '" target="_blank" rel="noopener">Bestand auf mobile.de ' + ICON.ext + "</a>" : "") +
        '<a class="btn ' + (mde && kind !== "empty" ? "btn--ghost" : "") + '" href="https://wa.me/' + esc(C.whatsapp) + '" target="_blank" rel="noopener">' + ICON.chat + " Per WhatsApp fragen</a>" +
      "</div>" +
      (C.phone ? '<a class="stock-fallback__tel" href="tel:' + esc(C.phone) + '">Oder anrufen: ' + esc(C.phoneDisplay || C.phone) + "</a>" : "") +
    "</div>";
  }

  /* ---------- Detailansicht ---------- */
  var dlg = null, current = null, lastFocus = null;
  function row(k, v) { return v ? "<div><dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd></div>" : ""; }
  function openCar(id, push) {
    var a = state.ads.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    current = a;
    if (!dlg) {
      dlg = document.createElement("div");
      dlg.className = "car-dlg";
      dlg.setAttribute("role", "dialog");
      dlg.setAttribute("aria-modal", "true");
      dlg.innerHTML = '<div class="car-dlg__bg" data-close></div><div class="car-dlg__panel" tabindex="-1"></div>';
      document.body.appendChild(dlg);
      dlg.addEventListener("click", function (e) {
        if (e.target.closest("[data-close]")) { e.preventDefault(); closeCar(); }
        var nav = e.target.closest("[data-gal]");
        if (nav) galStep(+nav.getAttribute("data-gal"));
        var th = e.target.closest("[data-thumb]");
        if (th) galGo(+th.getAttribute("data-thumb"));
        var more = e.target.closest("[data-desc-more]");
        if (more) { more.closest(".car-dlg__desc").classList.add("is-open"); more.remove(); }
      });
      document.addEventListener("keydown", function (e) {
        if (!dlg.classList.contains("is-open")) return;
        if (e.key === "Escape") closeCar();
        else if (e.key === "ArrowLeft") galStep(-1);
        else if (e.key === "ArrowRight") galStep(1);
        else if (e.key === "Tab") trap(e);
      });
    }
    var imgs = a.images, env = envkv(a);
    var facts = [
      row("Erstzulassung", a.firstReg ? ym(a.firstReg) : (a.condition === "NEW" ? "Neuwagen" : "")),
      row("Kilometerstand", a.km != null ? n0(a.km) + " km" : ""),
      row("Leistung", power(a)),
      row("Kraftstoff", fuel(a)),
      row("Getriebe", GEAR[a.gearbox]),
      row("Fahrzeugtyp", CAT[a.category] || ""),
      row("Hubraum", a.ccm ? n0(a.ccm) + " cm³" : ""),
      row("Batterie", a.battery ? String(a.battery).replace(".", ",") + " kWh" : ""),
      row("Reichweite", a.range ? n0(a.range) + " km" : ""),
      row("Farbe", (a.colorName || COLOR[a.color] || "") + (a.metallic ? " Metallic" : "")),
      row("Türen", DOORS[a.doors] || ""),
      row("Sitze", a.seats ? String(a.seats) : ""),
      row("Vorbesitzer", a.owners != null ? String(a.owners) : ""),
      row("HU", a.newHu ? "Neu" : a.hu ? ym(a.hu) : ""),
      row("Schadstoffklasse", emission(a.emissionClass)),
      row("Zustand", a.condition === "NEW" ? "Neuwagen" : USAGE[a.usage] || (a.condition === "USED" ? "Gebrauchtwagen" : "")),
      row("Unfallfrei", a.accident === "no" ? "Ja" : ""),
      row("Scheckheftgepflegt", a.service ? "Ja" : ""),
      row("Nichtraucherfahrzeug", a.nonSmoker ? "Ja" : "")
    ].join("");
    var desc = String(a.description || "").trim();
    var p = dlg.querySelector(".car-dlg__panel");
    p.innerHTML =
      '<button class="car-dlg__x" type="button" data-close aria-label="Schließen">' + ICON.close + "</button>" +
      '<div class="car-dlg__media"><div class="car-dlg__gal">' +
        (imgs.length ? '<div class="car-dlg__track" data-track>' + imgs.map(function (im, i) {
          return '<figure><img src="' + esc(i < 2 ? im.l : "") + '" data-src="' + esc(im.l) + '" srcset="' + esc(i < 2 ? srcset(im) + (im.xl ? ", " + im.xl + " 1600w" : "") : "") + '" data-srcset="' + esc(srcset(im) + (im.xl ? ", " + im.xl + " 1600w" : "")) + '" sizes="(max-width: 980px) 100vw, 62vw" alt="' + esc(fullName(a)) + " – Foto " + (i + 1) + '" decoding="async"></figure>';
        }).join("") + "</div>" : '<div class="car-dlg__noimg">' + ICON.car + "<small>Fotos folgen in Kürze</small></div>") +
        (imgs.length > 1 ? '<button class="car-dlg__nav car-dlg__nav--prev" type="button" data-gal="-1" aria-label="Vorheriges Foto">' + ICON.prev + '</button><button class="car-dlg__nav car-dlg__nav--next" type="button" data-gal="1" aria-label="Nächstes Foto">' + ICON.next + '</button><span class="car-dlg__counter" data-counter>1 / ' + imgs.length + "</span>" : "") +
      "</div>" +
      (imgs.length > 1 ? '<div class="car-dlg__thumbs" data-thumbs>' + imgs.map(function (im, i) { return '<button type="button" data-thumb="' + i + '" aria-label="Foto ' + (i + 1) + '"' + (i ? "" : ' class="is-on"') + '><img src="' + esc(im.s) + '" alt="" loading="lazy" decoding="async"></button>'; }).join("") + "</div>" : "") +
      "</div>" +
      '<div class="car-dlg__info">' +
        '<span class="car__make">' + esc(make(a.make)) + "</span>" +
        "<h2>" + esc(title(a)) + "</h2>" +
        '<div class="car-dlg__price">' + esc(price(a.price)) + (a.vat ? "<small>MwSt. ausweisbar</small>" : "") + (RATING[a.rating] ? '<span class="car__badge car__badge--deal">' + RATING[a.rating] + "</span>" : "") + "</div>" +
        '<div class="car-dlg__cta">' +
          '<a class="btn" href="' + esc(waLink(a)) + '" target="_blank" rel="noopener">' + ICON.chat + " WhatsApp</a>" +
          (C.phone ? '<a class="btn btn--ghost" href="tel:' + esc(C.phone) + '">' + ICON.phone + " Anrufen</a>" : "") +
        "</div>" +
        '<dl class="car-dlg__facts">' + facts + "</dl>" +
        (env ? '<p class="car-dlg__envkv">' + esc(env) + "</p>" : "") +
        (a.features && a.features.length ? '<h3>Ausstattung</h3><ul class="car-dlg__feat">' + a.features.map(function (f) { return "<li>" + ICON.check + esc(f) + "</li>"; }).join("") + "</ul>" : "") +
        (desc ? '<h3>Beschreibung</h3><div class="car-dlg__desc' + (desc.length < 420 ? " is-open" : "") + '"><p>' + esc(desc).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>") + "</p>" + (desc.length >= 420 ? '<button type="button" class="link-arrow" data-desc-more>Mehr lesen</button>' : "") + "</div>" : "") +
        (a.url ? '<a class="car-dlg__mde" href="' + esc(a.url) + '" target="_blank" rel="noopener">Inserat auf mobile.de ansehen ' + ICON.ext + "</a>" : "") +
        '<p class="car-dlg__note">Alle Angaben ohne Gewähr. Irrtümer, Änderungen und Zwischenverkauf vorbehalten.</p>' +
      "</div>";
    gal = { i: 0, n: imgs.length, track: p.querySelector("[data-track]") };
    if (gal.track) {
      var t;
      gal.track.addEventListener("scroll", function () {
        clearTimeout(t);
        t = setTimeout(function () { var i = Math.round(gal.track.scrollLeft / Math.max(1, gal.track.clientWidth)); setGal(i); }, 60);
        lazyGal(Math.round(gal.track.scrollLeft / Math.max(1, gal.track.clientWidth)));
      }, { passive: true });
    }
    lastFocus = document.activeElement;
    document.body.classList.add("is-locked");
    dlg.classList.add("is-open");
    requestAnimationFrame(function () { dlg.classList.add("is-shown"); p.scrollTop = 0; p.focus({ preventScroll: true }); });
    if (push !== false) try { history.pushState({ car: a.id }, "", "#fz-" + a.id); } catch (e) { location.hash = "fz-" + a.id; }
    document.title = fullName(a) + " – " + (C.name || "Fahrzeuge");
  }
  var baseTitle = document.title;
  function closeCar(fromPop) {
    if (!dlg || !dlg.classList.contains("is-open")) return;
    dlg.classList.remove("is-shown");
    document.body.classList.remove("is-locked");
    setTimeout(function () { dlg.classList.remove("is-open"); }, reduce ? 0 : 380);
    document.title = baseTitle;
    if (!fromPop && /^#fz-/.test(location.hash)) {
      if (history.state && history.state.car) history.back();
      else try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ok */ }
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function trap(e) {
    var f = dlg.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* Galerie */
  var gal = { i: 0, n: 0, track: null };
  function lazyGal(i) {
    if (!gal.track) return;
    var figs = gal.track.children;
    for (var k = Math.max(0, i - 1); k <= Math.min(figs.length - 1, i + 2); k++) {
      var im = figs[k].firstChild;
      if (im && !im.getAttribute("src")) { im.setAttribute("srcset", im.getAttribute("data-srcset")); im.setAttribute("src", im.getAttribute("data-src")); }
    }
  }
  function setGal(i) {
    gal.i = Math.max(0, Math.min(gal.n - 1, i));
    var c = dlg.querySelector("[data-counter]"); if (c) c.textContent = gal.i + 1 + " / " + gal.n;
    var th = dlg.querySelectorAll("[data-thumb]");
    th.forEach(function (b, k) { b.classList.toggle("is-on", k === gal.i); });
    if (th[gal.i]) { var box = th[gal.i].parentNode; box.scrollTo({ left: th[gal.i].offsetLeft - box.clientWidth / 2 + th[gal.i].clientWidth / 2, behavior: reduce ? "auto" : "smooth" }); }
    lazyGal(gal.i);
  }
  function galGo(i) {
    if (!gal.track) return;
    i = (i + gal.n) % gal.n;
    lazyGal(i);
    gal.track.scrollTo({ left: i * gal.track.clientWidth, behavior: reduce ? "auto" : "smooth" });
    setGal(i);
  }
  function galStep(d) { galGo(gal.i + d); }

  /* ---------- Startseite: neueste Fahrzeuge als Vorschau ---------- */
  function teaser(box, ads) {
    var top = ads.filter(function (a) { return a.images.length; }).slice(0, 4);
    if (!top.length) return;
    box.innerHTML = top.map(function (a, i) {
      var im = a.images[0];
      return '<div class="stock__row is-real" style="--i:' + i + '"><span class="stock__thumb"><img src="' + esc(im.s) + '" alt="" loading="lazy" decoding="async"></span>' +
        '<span class="stock__car"><b>' + esc(fullName(a)) + "</b><small>" + esc(specs(a).slice(0, 3).join(" · ")) + "</small></span>" +
        '<span class="stock__amount">' + esc(price(a.price)) + "</span></div>";
    }).join("");
    box.classList.add("is-real");
    var cnt = document.querySelector("[data-stock-total]");
    if (cnt) { cnt.textContent = ads.length + (ads.length === 1 ? " Fahrzeug" : " Fahrzeuge"); cnt.hidden = false; }
  }

  /* ---------- Start ---------- */
  function start() {
    var root = document.querySelector("[data-stock]");
    var tbox = document.querySelector("[data-stock-teaser]");
    if (!root && !tbox) return;
    fetchStock().then(function (d) {
      var ads = (d && d.ads) || [];
      ads.forEach(function (a) { a.images = a.images || []; });
      if (tbox) teaser(tbox, ads);
      if (!root) return;
      if (!d.ok) return fallback(root, "api");
      if (!ads.length) return fallback(root, "empty");
      state.ads = ads;
      buildFilters(root);
      renderGrid(root);
      var m = /^#fz-(.+)$/.exec(location.hash);
      if (m) openCar(decodeURIComponent(m[1]), false);
    }).catch(function () { if (root) fallback(root, "api"); });

    if (!root) return;
    root.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#fz-"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      openCar(a.getAttribute("href").slice(4));
    });
    window.addEventListener("popstate", function () {
      var m = /^#fz-(.+)$/.exec(location.hash);
      if (m) openCar(decodeURIComponent(m[1]), false); else closeCar(true);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
