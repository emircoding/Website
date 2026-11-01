/* ==========================================================================
   Fahrzeugbestand – laden, darstellen, filtern, Detailansicht
   ========================================================================== */
(function () {
  "use strict";
  var C = window.AZN_CONFIG || {};

  /* ---------- Helfer ---------- */
  var nf = new Intl.NumberFormat("de-DE");
  function price(n) { return n ? nf.format(Math.round(n)) + " €" : "Preis auf Anfrage"; }
  function km(n) { return n || n === 0 ? nf.format(n) + " km" : "–"; }
  function ps(kw) { return kw ? Math.round(kw * 1.35962) + " PS" : "–"; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function regSortKey(r) { var m = /(\d{1,2})\/(\d{4})/.exec(r || ""); return m ? +m[2] * 100 + +m[1] : 0; }
  function title(v) { return (v.make + " " + v.model).trim(); }

  var ICON = {
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    road: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20a8 8 0 1 0-8-8"/><path d="m12 12 4-3"/><circle cx="12" cy="12" r="1.2"/></svg>',
    fuel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M4 10h10M14 8l3 3v6a1.5 1.5 0 0 0 3 0V8l-3-3"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="5" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><path d="M5 7v10M12 7v10M19 7v5H5"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5c-2.2 4.6-9.2 9-9.2 9z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 6-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 6 6 6-6 6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.4 8.4 0 1 1 21 11.5z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'
  };

  /* ---------- Fahrzeug-Silhouette (Platzhalter, solange keine Fotos da sind) ---------- */
  var SHAPES = {
    sedan: {
      body: "M60 214 C 52 200, 50 178, 56 164 C 60 152, 72 146, 96 142 C 150 134, 200 120, 250 98 C 300 76, 360 64, 420 62 C 480 60, 530 72, 580 98 C 610 112, 640 120, 690 126 C 760 134, 820 142, 846 156 C 858 164, 860 182, 852 200 L 846 214 L 758 214 A 58 58 0 0 0 642 214 L 273 214 A 58 58 0 0 0 157 214 Z",
      glass: "M250 112 C 300 88, 360 76, 422 75 C 474 74, 520 88, 562 108 C 520 113, 400 116, 268 117 Z",
      pillars: [[444, 75, 117]], wheels: [215, 700], lamp: "M796 146 C 818 148, 836 154, 848 163 C 832 164, 812 160, 796 150 Z", line: "M110 156 C 300 146, 560 142, 830 158"
    },
    suv: {
      body: "M112 214 C 104 196, 104 160, 110 140 C 114 126, 124 118, 146 114 L 196 108 C 226 80, 262 52, 312 46 L 540 44 C 580 46, 606 70, 632 98 C 690 104, 750 110, 784 122 C 800 130, 806 160, 800 200 L 794 214 L 726 214 A 58 58 0 0 0 610 214 L 308 214 A 58 58 0 0 0 192 214 Z",
      glass: "M214 106 C 240 82, 270 58, 316 54 L 532 52 C 566 56, 592 80, 612 102 Z",
      pillars: [[430, 53, 104]], wheels: [250, 668], lamp: "M760 116 C 780 118, 796 124, 802 132 C 786 134, 768 130, 760 122 Z", line: "M140 146 C 300 140, 560 136, 796 146"
    },
    hatch: {
      body: "M70 214 C 60 196, 58 160, 64 136 C 68 118, 84 100, 120 92 C 160 70, 220 56, 300 54 L 470 54 C 520 56, 560 80, 600 104 C 680 112, 770 120, 820 136 C 840 144, 846 170, 840 200 L 834 214 L 754 214 A 58 58 0 0 0 638 214 L 273 214 A 58 58 0 0 0 157 214 Z",
      glass: "M136 100 C 178 78, 228 64, 300 62 L 468 62 C 510 64, 546 84, 578 104 Z",
      pillars: [[372, 63, 103]], wheels: [215, 696], lamp: "M790 128 C 810 130, 830 136, 838 144 C 820 146, 800 140, 790 134 Z", line: "M90 150 C 300 142, 560 138, 830 150"
    }
  };
  var uidN = 0;
  function shapeFor(body) {
    body = (body || "").toLowerCase();
    if (/suv|gelände|pick/.test(body)) return SHAPES.suv;
    if (/kombi|klein|kompakt|van|hatch|estate/.test(body)) return SHAPES.hatch;
    return SHAPES.sedan;
  }
  function carSVG(v, cls) {
    var s = shapeFor(v.body), u = "c" + (++uidN), col = v.colorHex || "#2a2a2e";
    var wheels = s.wheels.map(function (x) {
      return '<g><circle cx="' + x + '" cy="214" r="50" fill="#0b0b0c"/><circle cx="' + x + '" cy="214" r="35" fill="url(#' + u + 'r)"/>' +
        '<g stroke="#2b2b2f" stroke-width="7" stroke-linecap="round"><path d="M' + x + ' 214V183M' + x + ' 214l29-10M' + x + ' 214l18 25M' + x + ' 214l-18 25M' + x + ' 214l-29-10"/></g>' +
        '<circle cx="' + x + '" cy="214" r="7" fill="#1a1a1c"/></g>';
    }).join("");
    var arches = s.wheels.map(function (x) { return '<path fill="#09090a" d="M' + (x - 58) + ' 214 A 58 58 0 0 1 ' + (x + 58) + ' 214 Z"/>'; }).join("");
    var pillars = s.pillars.map(function (p) { return '<path stroke="' + col + '" stroke-width="9" d="M' + p[0] + " " + p[1] + " L " + (p[0] - 3) + " " + p[2] + '"/>'; }).join("");
    return '<svg class="' + (cls || "ph") + '" viewBox="0 0 900 290" aria-hidden="true">' +
      '<defs><linearGradient id="' + u + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>' +
      '<linearGradient id="' + u + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8c939d"/><stop offset=".5" stop-color="#2a2e35"/><stop offset="1" stop-color="#0d0e10"/></linearGradient>' +
      '<radialGradient id="' + u + 'r"><stop offset="0" stop-color="#ededed"/><stop offset=".7" stop-color="#a1a1a6"/><stop offset="1" stop-color="#55555a"/></radialGradient>' +
      '<radialGradient id="' + u + 's"><stop offset="0" stop-color="#000" stop-opacity=".4"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="455" cy="262" rx="430" ry="15" fill="url(#' + u + 's)"/>' +
      '<path fill="' + col + '" d="' + s.body + '"/><path fill="url(#' + u + 'b)" d="' + s.body + '"/>' + arches +
      '<path fill="url(#' + u + 'g)" d="' + s.glass + '"/>' + pillars +
      '<path fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" d="' + s.line + '"/>' +
      '<path fill="#f4f4f4" d="' + s.lamp + '"/>' + wheels + "</svg>";
  }

  /* ---------- Laden ---------- */
  var cache = null;
  function load() {
    if (cache) return cache;
    cache = new Promise(function (resolve) {
      var demo = { vehicles: (window.AZN_DEMO || []).slice(), live: false };
      if (!/^https?:$/.test(location.protocol) || !C.inventoryApi) return resolve(demo);
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; resolve(demo); } }, 6000);
      fetch(C.inventoryApi, { headers: { Accept: "application/json" } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (done) return; done = true; clearTimeout(t);
          if (j && Array.isArray(j.vehicles) && j.vehicles.length) resolve({ vehicles: j.vehicles, live: true });
          else resolve(demo);
        })
        .catch(function () { if (!done) { done = true; clearTimeout(t); resolve(demo); } });
    });
    return cache;
  }

  /* ---------- Merkliste (nur im eigenen Browser) ---------- */
  var FAV_KEY = "azn-merkliste";
  function favs() { try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch (e) { return []; } }
  function setFavs(a) { try { localStorage.setItem(FAV_KEY, JSON.stringify(a)); } catch (e) { /* privat-modus */ } }
  function isFav(id) { return favs().indexOf(String(id)) > -1; }
  function toggleFav(id) {
    var a = favs(), i = a.indexOf(String(id));
    if (i > -1) a.splice(i, 1); else a.push(String(id));
    setFavs(a);
    document.dispatchEvent(new CustomEvent("azn:favs"));
    return i === -1;
  }

  /* ---------- Karte ---------- */
  function card(v, i) {
    var media = v.images && v.images.length
      ? '<img src="' + esc(v.images[0]) + '" alt="' + esc(title(v)) + '" loading="lazy" decoding="async">'
      : carSVG(v);
    var badge = v.badge || (v.highlight ? "Highlight" : "");
    return '<article class="vcard" data-reveal style="--d:' + ((i % 4) * 0.08) + 's" data-id="' + esc(v.id) + '" tabindex="0" role="button" aria-label="' + esc(title(v)) + ' – Details ansehen">' +
      '<div class="vcard__media">' + (badge ? '<span class="vcard__badge">' + esc(badge) + "</span>" : "") +
      '<button class="vcard__fav' + (isFav(v.id) ? " is-on" : "") + '" type="button" aria-label="Auf die Merkliste" data-fav="' + esc(v.id) + '">' + ICON.heart + "</button>" + media + "</div>" +
      '<div class="vcard__body"><div><div class="vcard__make">' + esc(v.make) + '</div><h3 class="vcard__title">' + esc(v.model) + (v.variant ? ' <span style="font-weight:400;color:var(--mute)">' + esc(v.variant) + "</span>" : "") + "</h3></div>" +
      '<div class="vcard__specs"><span>' + ICON.cal + esc(v.firstReg || "Neu") + "</span><span>" + ICON.road + km(v.mileage) + "</span><span>" + ICON.fuel + esc(v.fuel || "–") + "</span><span>" + ICON.bolt + ps(v.powerKw) + "</span></div>" +
      '<div class="vcard__foot"><div class="vcard__price">' + price(v.price) + "<small>inkl. MwSt. / Differenzbest.</small></div><span class=\"vcard__go\">" + ICON.arrow + "</span></div></div></article>";
  }

  /* ---------- Detail-Modal ---------- */
  var modal, lastFocus;
  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement("div");
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = '<div class="modal__backdrop" data-close></div><div class="modal__panel"><button class="modal__close" data-close aria-label="Schließen">' + ICON.close + '</button><div class="modal__content" style="display:contents"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeModal(); });
    document.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    });
    return modal;
  }
  var gal = { imgs: [], i: 0 };
  function step(d) {
    if (gal.imgs.length < 2) return;
    gal.i = (gal.i + d + gal.imgs.length) % gal.imgs.length;
    renderGal();
  }
  function renderGal() {
    var main = modal.querySelector(".gallery__main img");
    if (main) main.src = gal.imgs[gal.i];
    modal.querySelectorAll(".gallery__thumbs button").forEach(function (b, i) { b.classList.toggle("is-active", i === gal.i); });
  }
  function openModal(v) {
    ensureModal();
    lastFocus = document.activeElement;
    gal = { imgs: v.images || [], i: 0 };
    var name = title(v);
    var msg = "Hallo, ich interessiere mich für den " + name + (v.variant ? " " + v.variant : "") + " (" + price(v.price) + ", EZ " + (v.firstReg || "–") + ", " + km(v.mileage) + "). Ist das Fahrzeug noch verfügbar?";
    var gallery = gal.imgs.length
      ? '<div class="gallery__main"><img src="' + esc(gal.imgs[0]) + '" alt="' + esc(name) + '">' +
        (gal.imgs.length > 1 ? '<button class="gallery__nav gallery__nav--prev" data-step="-1" aria-label="Vorheriges Bild">' + ICON.left + '</button><button class="gallery__nav gallery__nav--next" data-step="1" aria-label="Nächstes Bild">' + ICON.right + "</button>" : "") +
        "</div>" + (gal.imgs.length > 1 ? '<div class="gallery__thumbs">' + gal.imgs.map(function (src, i) { return '<button data-thumb="' + i + '"' + (i === 0 ? ' class="is-active"' : "") + '><img src="' + esc(src) + '" alt="" loading="lazy"></button>'; }).join("") + "</div>" : "")
      : '<div class="gallery__main">' + carSVG(v) + "</div>";
    var specs = [
      ["Erstzulassung", v.firstReg || "–"], ["Kilometer", km(v.mileage)],
      ["Leistung", v.powerKw ? v.powerKw + " kW (" + ps(v.powerKw) + ")" : "–"], ["Kraftstoff", v.fuel || "–"],
      ["Getriebe", v.gearbox || "–"], ["Karosserie", v.body || "–"],
      ["Farbe", v.color || "–"], ["Vorbesitzer", v.owners != null ? v.owners : "–"]
    ];
    modal.querySelector(".modal__content").innerHTML =
      '<div class="gallery">' + gallery + "</div>" +
      '<div class="detail"><div><div class="vcard__make">' + esc(v.make) + '</div><h2 class="detail__title">' + esc(v.model) + "</h2>" + (v.variant ? '<p style="color:var(--mute);margin-top:6px">' + esc(v.variant) + "</p>" : "") + "</div>" +
      '<div class="detail__price">' + price(v.price) + "<small>inkl. MwSt. bzw. differenzbesteuert</small></div>" +
      '<dl class="spec-grid">' + specs.map(function (s) { return "<div><dt>" + s[0] + "</dt><dd>" + esc(s[1]) + "</dd></div>"; }).join("") + "</dl>" +
      (v.features && v.features.length ? '<div class="tags">' + v.features.slice(0, 18).map(function (f) { return "<span>" + esc(f) + "</span>"; }).join("") + "</div>" : "") +
      (v.description ? '<p class="detail__desc">' + esc(v.description).slice(0, 1200) + "</p>" : "") +
      '<div class="detail__actions">' +
      '<a class="btn" href="https://wa.me/' + esc(C.whatsapp) + "?text=" + encodeURIComponent(msg) + '" target="_blank" rel="noopener">' + ICON.chat + " Per WhatsApp anfragen</a>" +
      '<a class="btn btn--ghost" href="tel:' + esc(C.phone) + '">' + ICON.phone + " " + esc(C.phoneDisplay) + "</a>" +
      '<a class="btn btn--ghost" href="mailto:' + esc(C.email) + "?subject=" + encodeURIComponent("Anfrage: " + name) + "&body=" + encodeURIComponent(msg) + '">' + ICON.mail + " E-Mail-Anfrage</a>" +
      (v.url ? '<a class="link-arrow" style="justify-self:center;margin-top:8px" href="' + esc(v.url) + '" target="_blank" rel="noopener">Inserat auf mobile.de ' + ICON.ext + "</a>" : "") +
      "</div></div>";
    modal.querySelectorAll("[data-step]").forEach(function (b) { b.addEventListener("click", function () { step(+b.dataset.step); }); });
    modal.querySelectorAll("[data-thumb]").forEach(function (b) { b.addEventListener("click", function () { gal.i = +b.dataset.thumb; renderGal(); }); });
    // Wischen auf dem iPhone
    var main = modal.querySelector(".gallery__main"), sx = null;
    main.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    main.addEventListener("touchend", function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); sx = null; });

    modal.querySelector(".modal__panel").scrollTop = 0;
    document.body.classList.add("is-locked");
    requestAnimationFrame(function () { modal.classList.add("is-open"); modal.querySelector(".modal__close").focus({ preventScroll: true }); });
    try { history.replaceState(null, "", "#fz-" + encodeURIComponent(v.id)); } catch (e) { /* ok */ }
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ok */ }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  /* ---------- Grid-Verhalten (Klick, Merkliste, Tilt) ---------- */
  function bindGrid(grid, list) {
    function find(id) { for (var i = 0; i < list().length; i++) if (String(list()[i].id) === id) return list()[i]; return null; }
    grid.addEventListener("click", function (e) {
      var fav = e.target.closest("[data-fav]");
      if (fav) { e.stopPropagation(); fav.classList.toggle("is-on", toggleFav(fav.dataset.fav)); return; }
      var c = e.target.closest(".vcard"); if (!c) return;
      var v = find(c.dataset.id); if (v) openModal(v);
    });
    grid.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var c = e.target.closest(".vcard"); if (!c || e.target !== c) return;
      e.preventDefault(); var v = find(c.dataset.id); if (v) openModal(v);
    });
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      grid.addEventListener("pointermove", function (e) {
        var c = e.target.closest(".vcard"); if (!c) return;
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = "perspective(900px) rotateY(" + (x * 6) + "deg) rotateX(" + (-y * 6) + "deg) translateY(-4px)";
      });
      grid.addEventListener("pointerout", function (e) {
        var c = e.target.closest(".vcard"); if (c && !c.contains(e.relatedTarget)) c.style.transform = "";
      });
    }
  }
  function deepLink(list) {
    var m = /^#fz-(.+)$/.exec(location.hash);
    if (!m) return;
    var id = decodeURIComponent(m[1]);
    list.forEach(function (v) { if (String(v.id) === id) openModal(v); });
  }
  function reveal(root) { if (window.AZN && window.AZN.observe) window.AZN.observe(root); }

  /* ---------- Startseite: Highlights ---------- */
  function initHighlights(grid) {
    var data = [];
    bindGrid(grid, function () { return data; });
    load().then(function (res) {
      var all = res.vehicles;
      var hl = all.filter(function (v) { return v.highlight; });
      data = (hl.length >= 4 ? hl : hl.concat(all.filter(function (v) { return !v.highlight; }))).slice(0, 4);
      grid.innerHTML = data.map(card).join("");
      reveal(grid);
      document.querySelectorAll("[data-stock-count]").forEach(function (el) {
        el.setAttribute("data-count", all.length);
        if (el.classList.contains("is-in") && window.AZN) window.AZN.count(el);
      });
      deepLink(all);
      data = all; // Deep-Links & Klicks auf alle Fahrzeuge erlauben
    });
  }

  /* ---------- Fahrzeugseite: kompletter Bestand mit Filter ---------- */
  function initList(grid) {
    var all = [], shown = [], onlyFav = false;
    var f = {
      q: document.getElementById("f-q"), make: document.getElementById("f-make"), price: document.getElementById("f-price"),
      fuel: document.getElementById("f-fuel"), gear: document.getElementById("f-gear"), sort: document.getElementById("f-sort")
    };
    var countEl = document.getElementById("result-count"), srcEl = document.getElementById("result-src"), favBtn = document.getElementById("fav-toggle");
    bindGrid(grid, function () { return all; });

    function fill(sel, values, label) {
      if (!sel) return;
      sel.innerHTML = '<option value="">' + label + "</option>" + values.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + "</option>"; }).join("");
    }
    function uniq(key) { var s = {}; all.forEach(function (v) { if (v[key]) s[v[key]] = 1; }); return Object.keys(s).sort(function (a, b) { return a.localeCompare(b, "de"); }); }

    function apply() {
      var q = (f.q.value || "").toLowerCase().trim(), mk = f.make.value, pr = +f.price.value || 0, fu = f.fuel.value, ge = f.gear.value, fv = favs();
      shown = all.filter(function (v) {
        if (mk && v.make !== mk) return false;
        if (pr && v.price > pr) return false;
        if (fu && v.fuel !== fu) return false;
        if (ge && v.gearbox !== ge) return false;
        if (onlyFav && fv.indexOf(String(v.id)) < 0) return false;
        if (q) {
          var hay = [v.make, v.model, v.variant, v.fuel, v.body, v.color].concat(v.features || []).join(" ").toLowerCase();
          if (q.split(/\s+/).some(function (w) { return hay.indexOf(w) < 0; })) return false;
        }
        return true;
      });
      var s = f.sort.value;
      shown.sort(function (a, b) {
        if (s === "price-asc") return (a.price || 9e9) - (b.price || 9e9);
        if (s === "price-desc") return (b.price || 0) - (a.price || 0);
        if (s === "km-asc") return (a.mileage || 0) - (b.mileage || 0);
        if (s === "reg-desc") return regSortKey(b.firstReg) - regSortKey(a.firstReg);
        return 0;
      });
      countEl.textContent = shown.length + (shown.length === 1 ? " Fahrzeug" : " Fahrzeuge");
      grid.innerHTML = shown.length ? shown.map(card).join("")
        : '<div class="empty"><strong>Kein passendes Fahrzeug.</strong>Passen Sie die Filter an – oder fragen Sie uns: Wir suchen Ihr Wunschauto gern für Sie.</div>';
      reveal(grid);
    }

    load().then(function (res) {
      all = res.vehicles;
      srcEl.innerHTML = res.live ? "<i></i>Live-Bestand von mobile.de" : "<i></i>Demo-Bestand – mobile.de wird verbunden";
      srcEl.classList.toggle("live", res.live);
      fill(f.make, uniq("make"), "Alle Marken");
      fill(f.fuel, uniq("fuel"), "Kraftstoff");
      fill(f.gear, uniq("gearbox"), "Getriebe");
      var params = new URLSearchParams(location.search);
      if (params.get("marke")) f.make.value = params.get("marke");
      if (params.get("q")) f.q.value = params.get("q");
      apply();
      deepLink(all);
    });

    var tmr;
    f.q.addEventListener("input", function () { clearTimeout(tmr); tmr = setTimeout(apply, 160); });
    ["make", "price", "fuel", "gear", "sort"].forEach(function (k) { f[k].addEventListener("change", apply); });
    document.getElementById("f-reset").addEventListener("click", function () {
      f.q.value = ""; f.make.value = ""; f.price.value = ""; f.fuel.value = ""; f.gear.value = ""; f.sort.value = "";
      onlyFav = false; favBtn.setAttribute("aria-pressed", "false"); apply();
    });
    function favLabel() { favBtn.querySelector("span").textContent = "Merkliste (" + favs().length + ")"; }
    favBtn.addEventListener("click", function () { onlyFav = !onlyFav; favBtn.setAttribute("aria-pressed", String(onlyFav)); apply(); });
    document.addEventListener("azn:favs", function () { favLabel(); if (onlyFav) apply(); });
    favLabel();
    var toggle = document.querySelector(".filters__toggle");
    if (toggle) toggle.addEventListener("click", function () {
      var bar = document.querySelector(".filters");
      var on = bar.classList.toggle("is-expanded");
      toggle.setAttribute("aria-expanded", String(on));
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var hl = document.querySelector("[data-highlights]");
    if (hl) initHighlights(hl);
    var list = document.querySelector("[data-inventory]");
    if (list) initList(list);
  });

  window.AZN_INV = { load: load, carSVG: carSVG };
})();
