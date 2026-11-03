/* ==========================================================================
   Automobilzentrum Nagold – Interaktionen & Motion
   ========================================================================== */
(function () {
  "use strict";
  var C = window.AZN_CONFIG || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var root = document.documentElement;

  /* ---------- Beim Neuladen immer ganz oben starten (auch iPhone/Safari) ---------- */
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) { /* ok */ }
  var nav = window.performance && performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
  var isReload = nav ? nav.type === "reload" : (window.performance && performance.navigation && performance.navigation.type === 1);
  function toTop() {
    var de = document.documentElement, prev = de.style.scrollBehavior;
    de.style.scrollBehavior = "auto"; // kein weiches Scrollen, sofort nach oben
    window.scrollTo(0, 0);
    de.scrollTop = 0; if (document.body) document.body.scrollTop = 0;
    de.style.scrollBehavior = prev;
  }
  // Safari (iOS) merkt sich die Position beim Verlassen/Neuladen – vorher nach oben setzen,
  // damit beim nächsten Laden die gespeicherte Position „oben“ ist.
  window.addEventListener("pagehide", toTop);
  if (isReload) {
    // Sprungmarke (z. B. #kontakt) beim Neuladen entfernen, damit es oben losgeht
    if (location.hash) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ok */ } }
    var userScrolled = false;
    var stop = function () { userScrolled = true; };
    ["touchstart", "wheel", "keydown", "mousedown"].forEach(function (ev) { window.addEventListener(ev, stop, { once: true, passive: true }); });
    var again = function () { if (!userScrolled) toTop(); };
    toTop();
    document.addEventListener("DOMContentLoaded", again);
    window.addEventListener("load", function () {
      // Safari stellt die alte Position teils verzögert wieder her → mehrfach nachziehen
      [0, 50, 120, 250, 500, 900].forEach(function (t) { setTimeout(again, t); });
      requestAnimationFrame(function () { requestAnimationFrame(again); });
    });
    window.addEventListener("pageshow", again);
  }

  /* ---------- Firmendaten aus config.js einsetzen ---------- */
  function applyConfig() {
    var map = {
      name: C.name, legalName: C.legalName || C.name, owner: C.owner, street: C.street, zipcity: (C.zip || "") + " " + (C.city || ""),
      phoneDisplay: C.phoneDisplay, email: C.email, vatId: C.vatId, register: C.register,
      address: C.street + ", " + C.zip + " " + C.city, year: String(new Date().getFullYear())
    };
    document.querySelectorAll("[data-cfg]").forEach(function (el) {
      var k = el.getAttribute("data-cfg");
      if (map[k] != null && map[k] !== "") el.textContent = map[k];
    });
    // Optionale Impressums-Abschnitte ausblenden, wenn leer
    document.querySelectorAll("[data-optional]").forEach(function (el) {
      var v = C[el.getAttribute("data-optional")];
      el.hidden = !(v && String(v).trim());
    });
    // Hinweis „Platzhalter“ nur zeigen, solange noch Beispieldaten eingetragen sind
    var placeholders = /Muster|000 000|0000000/.test([C.owner, C.street, C.phone, C.phoneDisplay, C.whatsapp].join(" "));
    document.querySelectorAll("[data-placeholder-notice]").forEach(function (el) { el.hidden = !placeholders; });
    var maps = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.name + ", " + C.street + ", " + C.zip + " " + C.city);
    var G = C.google || {};
    var gprofile = G.profileUrl || maps;
    var hrefs = { tel: "tel:" + C.phone, mail: "mailto:" + C.email, wa: "https://wa.me/" + C.whatsapp, maps: maps, mobilede: C.mobileDeUrl || mobileDeEmbedUrl() || "https://www.mobile.de/", gprofile: gprofile, greview: G.reviewUrl || gprofile };
    document.querySelectorAll("[data-href]").forEach(function (el) {
      var h = hrefs[el.getAttribute("data-href")];
      if (h) el.setAttribute("href", h);
    });
    document.querySelectorAll("[data-hours]").forEach(function (el) {
      el.innerHTML = (C.hours || []).map(function (h) { return "<dt>" + h[0] + "</dt><dd>" + h[1] + "</dd>"; }).join("");
    });
    // „Jetzt geöffnet“-Anzeige
    var badge = document.querySelector("[data-open-badge]");
    if (badge && C.schedule) {
      var now = new Date(), day = ["so", "mo", "di", "mi", "do", "fr", "sa"][now.getDay()];
      var slot = C.schedule[day], open = false;
      if (slot) {
        var p = slot.split("-"), mins = now.getHours() * 60 + now.getMinutes();
        var a = p[0].split(":"), b = p[1].split(":");
        open = mins >= +a[0] * 60 + +a[1] && mins < +b[0] * 60 + +b[1];
      }
      badge.classList.toggle("is-open", open);
      badge.querySelector("span").textContent = open ? "Jetzt geöffnet" : "Aktuell geschlossen";
    }
  }

  /* ---------- mobile.de: kompletter Bestand eingebettet ---------- */
  function mobileDeEmbedUrl() {
    if (C.mobileDeEmbed) return C.mobileDeEmbed;
    var id = String(C.mobileDeCustomerId || "").trim();
    return id ? "https://home.mobile.de/home/index.html?partnerHead=false&colorTheme=default&customerId=" + encodeURIComponent(id) : "";
  }
  function mobileDeEmbed() {
    var box = document.querySelector("[data-mde-embed]");
    if (!box) return;
    var st = box.querySelector(".mde-frame__state"), status = box.querySelector("[data-mde-status]"), url = mobileDeEmbedUrl();
    if (!url) {
      st.insertAdjacentHTML("beforeend", "<p>Hier erscheint der komplette Fahrzeugbestand von mobile.de. Dafür einmal die mobile.de-Kunden-ID in <code>assets/js/config.js</code> eintragen.</p>");
      if (status) status.textContent = "Noch nicht verbunden";
      return;
    }
    function load() {
      if (box.querySelector("iframe")) return;
      var gate = st.querySelector(".mde-gate");
      if (gate) gate.remove();
      if (status) status.textContent = "Bestand wird geladen …";
      var f = document.createElement("iframe");
      f.src = url;
      f.title = "Fahrzeugbestand auf mobile.de";
      f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      f.setAttribute("allow", "fullscreen; clipboard-write");
      f.addEventListener("load", function () { box.classList.add("is-loaded"); });
      box.appendChild(f);
      setTimeout(function () { if (!box.classList.contains("is-loaded") && status) status.textContent = "Lädt länger als üblich …"; }, 8000);
    }
    if (consent.get().external) return load();
    // Ohne Zustimmung: erst auf Klick laden (Datenschutz)
    if (status) status.textContent = "Ihre Zustimmung wird benötigt";
    st.insertAdjacentHTML("beforeend",
      '<div class="mde-gate"><p>Zum Schutz Ihrer Daten wird der Bestand von mobile.de erst nach Ihrer Zustimmung geladen. Dabei werden Daten (z. B. Ihre IP-Adresse) an mobile.de übertragen.</p>' +
      '<button class="btn" type="button" data-gate-load>Bestand von mobile.de laden</button>' +
      '<a class="mde-gate__more" href="datenschutz.html">Mehr in der Datenschutzerklärung</a></div>');
    st.querySelector("[data-gate-load]").addEventListener("click", function () {
      consent.set({ external: true });
      load();
    });
    document.addEventListener("azn:consent", function () { if (consent.get().external) load(); });
  }

  /* ---------- Cookie-/Einwilligungs-Banner ---------- */
  var consent = (function () {
    var KEY = "azn-consent", VERSION = 1, mem = null;
    function get() {
      if (mem) return mem;
      try { var v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v && v.v === VERSION) return (mem = v); } catch (e) { /* ok */ }
      return { v: VERSION, external: false, decided: false };
    }
    function set(o) {
      mem = { v: VERSION, external: !!o.external, decided: true, ts: new Date().toISOString() };
      try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* privat-modus: gilt für diese Seite */ }
      document.dispatchEvent(new CustomEvent("azn:consent"));
    }
    var el;
    function build() {
      el = document.createElement("div");
      el.className = "consent";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-label", "Cookie-Einstellungen");
      el.innerHTML =
        '<div class="consent__head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M21 12.5A9 9 0 1 1 11.5 3a3 3 0 0 0 3.5 3.5 3 3 0 0 0 3.5 3.5 3 3 0 0 0 2.5 2.5z"/><circle cx="8.5" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="15.5" r="1" fill="currentColor"/><circle cx="16" cy="13" r=".8" fill="currentColor"/><circle cx="8" cy="15" r=".6" fill="currentColor"/></svg><strong>Cookies &amp; Datenschutz</strong></div>' +
        '<p class="consent__text">Wir verwenden nur technisch notwendige Speicherungen. Für die Anzeige unseres Fahrzeugbestands binden wir Inhalte von <b>mobile.de</b> ein – dabei kann mobile.de Cookies setzen und Daten wie Ihre IP-Adresse erhalten. Mehr dazu in der <a href="datenschutz.html">Datenschutzerklärung</a> und im <a href="impressum.html">Impressum</a>.</p>' +
        '<div class="consent__details" hidden>' +
        '<label class="consent__opt"><span><b>Notwendig</b><small>Speichert Ihre Auswahl und sorgt für die Grundfunktionen der Seite.</small></span><input type="checkbox" checked disabled><i class="switch"></i></label>' +
        '<label class="consent__opt"><span><b>Externe Inhalte – mobile.de</b><small>Zeigt unseren kompletten Fahrzeugbestand direkt von mobile.de an.</small></span><input type="checkbox" data-opt="external"><i class="switch"></i></label>' +
        "</div>" +
        '<div class="consent__actions"><button class="btn btn--light" type="button" data-c="all">Alle akzeptieren</button><button class="btn btn--ghost" type="button" data-c="necessary">Nur notwendige</button></div>' +
        '<button class="consent__more" type="button" data-c="toggle">Einstellungen</button>';
      document.body.appendChild(el);
      var details = el.querySelector(".consent__details"), more = el.querySelector("[data-c=toggle]"), opt = el.querySelector("[data-opt=external]");
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-c]"); if (!b) return;
        var c = b.getAttribute("data-c");
        if (c === "all") { set({ external: true }); close(); }
        else if (c === "necessary") { set({ external: false }); close(); }
        else if (c === "save") { set({ external: opt.checked }); close(); }
        else if (c === "toggle") {
          details.hidden = false;
          opt.checked = get().external;
          more.textContent = "Auswahl speichern";
          more.setAttribute("data-c", "save");
          more.classList.add("is-save");
        }
      });
    }
    function open(expanded) {
      if (!el) build();
      if (expanded) el.querySelector("[data-c=toggle]") && el.querySelector("[data-c=toggle]").click();
      document.body.classList.add("consent-open");
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("is-open"); }); });
    }
    function close() {
      if (!el) return;
      el.classList.remove("is-open");
      document.body.classList.remove("consent-open");
    }
    function init() {
      document.querySelectorAll("[data-consent-open]").forEach(function (a) {
        a.addEventListener("click", function (e) { e.preventDefault(); open(true); });
      });
      if (!get().decided) setTimeout(function () { open(false); }, document.querySelector(".preloader") ? 1900 : 600);
    }
    return { get: get, set: set, init: init, open: open };
  })();

  /* ---------- Preloader (nur beim ersten Besuch pro Sitzung) ---------- */
  function preloader(done) {
    var el = document.querySelector(".preloader");
    var seen = false;
    try { seen = sessionStorage.getItem("azn-intro") === "1"; sessionStorage.setItem("azn-intro", "1"); } catch (e) { /* ok */ }
    if (!el) return done();
    if (seen || reduce) { el.remove(); return done(); }
    var finished = false;
    var finish = function () {
      if (finished) return; // nur einmal (regulär oder über das Sicherheitsnetz)
      finished = true;
      el.classList.add("is-done");
      setTimeout(done, 250);
      setTimeout(function () { el.remove(); }, 1100);
    };
    var start = Date.now();
    var go = function () { setTimeout(finish, Math.max(0, 1300 - (Date.now() - start))); };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);
    setTimeout(finish, 3000); // Sicherheitsnetz
  }

  /* ---------- Header: Zustand beim Scrollen ---------- */
  function header() {
    var h = document.querySelector(".header"), prog = document.querySelector(".progress"), fab = document.querySelector(".fab");
    var lastY = window.scrollY, ticking = false;
    function update() {
      var y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
      if (h) {
        h.classList.toggle("is-scrolled", y > 10);
        var menuOpen = document.body.classList.contains("menu-open");
        h.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastY + 2);
        if (y < lastY - 2) h.classList.remove("is-hidden");
      }
      if (prog) prog.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
      if (fab) fab.classList.toggle("is-visible", y > 600);
      parallax(y);
      statement();
      lastY = y; ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Mobiles Menü ---------- */
  function menu() {
    var btn = document.querySelector(".burger");
    if (!btn) return;
    function set(open) {
      document.body.classList.toggle("menu-open", open);
      document.body.classList.toggle("is-locked", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    }
    btn.addEventListener("click", function () { set(!document.body.classList.contains("menu-open")); });
    document.querySelectorAll(".mobile-menu a").forEach(function (a) { a.addEventListener("click", function () { set(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  }

  /* ---------- Einblend-Animationen ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("is-in");
        if (en.target.hasAttribute("data-count")) count(en.target);
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }) : null;
  function observe(scope) {
    (scope || document).querySelectorAll("[data-reveal]:not(.is-in), .split-line:not(.is-in), .img-reveal:not(.is-in), [data-count], .statement__mark").forEach(function (el) {
      if (io && !reduce) io.observe(el); else { el.classList.add("is-in"); if (el.hasAttribute("data-count")) count(el); }
    });
  }

  /* Überschriften Wort für Wort einblenden */
  function splitHeadings() {
    document.querySelectorAll("[data-split]").forEach(function (el) {
      var html = el.innerHTML.split(/<br\s*\/?>/i);
      var i = 0;
      el.innerHTML = html.map(function (line) {
        var tmp = document.createElement("div"); tmp.innerHTML = line.trim();
        var parts = [];
        tmp.childNodes.forEach(function (n) {
          if (n.nodeType === 3) n.textContent.split(/\s+/).filter(Boolean).forEach(function (w) { parts.push(w); });
          else parts.push(n.outerHTML);
        });
        return parts.map(function (w) {
          return '<span class="split-line" style="display:inline-block;vertical-align:top"><span style="--d:' + (i++ * 0.06).toFixed(2) + 's">' + w + "</span></span>";
        }).join(" ");
      }).join("<br>");
    });
  }

  /* ---------- Zähler ---------- */
  function count(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    var suffix = el.getAttribute("data-suffix") || "", dur = 1600, t0 = null;
    if (reduce) { el.textContent = target + suffix; return; }
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Parallax ---------- */
  var plx = [];
  function parallax(y) {
    if (reduce) return;
    for (var i = 0; i < plx.length; i++) {
      var el = plx[i], r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
      var off = (r.top + r.height / 2 - innerHeight / 2) * speed;
      el.style.setProperty("--py", off.toFixed(1) + "px");
    }
  }

  /* ---------- Statement: Wörter beim Scrollen aufleuchten ---------- */
  var words = [], stEl = null;
  function prepStatement() {
    stEl = document.querySelector("[data-scrub]");
    if (!stEl) return;
    var txt = stEl.textContent.trim().split(/\s+/);
    stEl.innerHTML = txt.map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" ");
    words = stEl.querySelectorAll(".w");
    if (reduce) words.forEach(function (w) { w.classList.add("on"); });
  }
  function statement() {
    if (!stEl || reduce) return;
    var r = stEl.getBoundingClientRect();
    var p = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.4);
    p = Math.max(0, Math.min(1, p));
    var n = Math.round(p * words.length);
    for (var i = 0; i < words.length; i++) words[i].classList.toggle("on", i < n);
  }

  /* ---------- Magnetische Buttons & Spotlight ---------- */
  function magnetic() {
    if (!fine || reduce) return;
    document.querySelectorAll(".btn, .vcard__go").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = "translate(" + x * 0.18 + "px," + y * 0.3 + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
    document.querySelectorAll(".service").forEach(function (s) {
      s.addEventListener("pointermove", function (e) {
        var r = s.getBoundingClientRect();
        s.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        s.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      });
    });
    // Hero: Tiefen-Effekt mit der Maus
    var hero = document.querySelector(".hero");
    if (hero) {
      var w = hero.querySelector(".hero__word:not(.hero__word--outline)");
      hero.addEventListener("pointermove", function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        var x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
        if (w) w.style.transform = "translate(" + x * -18 + "px," + y * -10 + "px)";
      });
    }
  }

  /* ---------- Hintergrund: feine Wellenlinien über die ganze Seite ---------- */
  function bgLines() {
    var c = document.createElement("canvas");
    if (!c.getContext) return;
    c.className = "bg-lines"; c.setAttribute("aria-hidden", "true");
    document.body.insertBefore(c, document.body.firstChild);
    var ctx = c.getContext("2d"), W = 0, H = 0, dpr = 1, gap = 14, t = 0, last = 0, lastNow = 0;
    function size() {
      var w = window.innerWidth, h = Math.max(window.innerHeight, c.clientHeight || 0);
      if (w === W && Math.abs(h - H) < 2) return false; // iPhone-Adressleiste: nur bei echter Größenänderung neu anlegen
      W = w; H = h;
      dpr = Math.min(2, window.devicePixelRatio || 1, Math.sqrt(5e6 / Math.max(1, W * H)));
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      gap = W < 700 ? 11 : 14;
      return true;
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var sc = reduce ? 0 : (window.scrollY || 0) * 0.0012, n = Math.ceil(H / gap) + 4, step = W < 700 ? 13 : 16;
      ctx.beginPath();
      for (var i = 0; i < n; i++) {
        var y0 = (i - 2) * gap, env = 0.55 + 0.45 * Math.sin(i * 0.085 + t * 0.12 + sc * 0.6), amp = gap * (0.5 + env * 1.05);
        for (var x = 0; x <= W + step; x += step) {
          var y = y0 + amp * (0.62 * Math.sin(x * 0.0055 + t * 0.45 + i * 0.23 + sc) + 0.38 * Math.sin(x * 0.012 - t * 0.6 + i * 0.11 - sc * 0.7));
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(11,11,12,.055)"; ctx.stroke();
    }
    size(); draw();
    window.addEventListener("resize", function () { if (size()) draw(); });
    if (reduce) return; // "Bewegung reduzieren": Linien stehen still
    (function loop(now) {
      requestAnimationFrame(loop);
      if (document.hidden || now - last < 33) return; // ~30 Bilder/s reichen für die ruhige Bewegung
      t += Math.min(0.1, (now - (lastNow || now)) / 1000); lastNow = now; last = now;
      draw();
    })(performance.now());
  }

  /* ---------- Hero: Speed-Schrift – Buchstaben schießen rein, bremsen (Bremslicht), rasen beim Scrollen davon ---------- */
  function heroSpeed() {
    var pin = document.querySelector("[data-hero-pin]");
    if (!pin || reduce || pin.dataset.speed) return;
    pin.dataset.speed = "1";
    var hero = pin.querySelector(".hero"), word = hero.querySelector(".hero__word");
    var back = hero.querySelector(".hero__fx--back"), front = hero.querySelector(".hero__fx--front"), tag = hero.querySelector(".hero__tagline");
    if (!word || !back || !front || !back.getContext) return;
    var spans = [].slice.call(word.querySelectorAll("span")), tags = tag ? [].slice.call(tag.children) : [];
    var B = back.getContext("2d"), F = front.getContext("2d");
    var W = 1, H = 1, dpr = 1, fs = 100, L = [], wy1 = 0, wh = 1, wcy = 0, lines = [], prevX = [];
    var target = 0, cur = 0, startAt = Infinity, started = false, lastNow = 0, t = 0, idle = false, live = false, cw = 0, ch = 0;
    var INK = "rgba(11,11,12,";
    hero.classList.add("hero--speed");
    spans.forEach(function (s) { s.style.opacity = 0; });

    function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function smooth(a, b, v) { var t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); }
    function eOutExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

    function measure() {
      W = hero.clientWidth; H = hero.clientHeight;
      // Schärfe wie das Display, aber Speicher begrenzen (große iPads)
      dpr = Math.min(2, window.devicePixelRatio || 1, Math.sqrt(5e6 / Math.max(1, W * H)));
      var nw = Math.round(W * dpr), nh = Math.round(H * dpr);
      // iPhone: Die Adressleiste löst beim Scrollen "resize" aus – Canvas nur bei echter Größenänderung neu anlegen
      if (nw !== cw || nh !== ch) { cw = nw; ch = nh; [back, front].forEach(function (c) { c.width = nw; c.height = nh; }); }
      var keep = spans.map(function (s) { return s.style.transform; }), wt = word.style.transform, wtr = word.style.transition;
      word.style.transition = "none"; word.style.transform = "none";
      spans.forEach(function (s) { s.style.transform = "none"; });
      var hr = hero.getBoundingClientRect();
      L = spans.map(function (s) { var r = s.getBoundingClientRect(); return { x: r.left - hr.left, y: r.top - hr.top, w: r.width, h: r.height, cx: r.left - hr.left + r.width / 2 }; });
      spans.forEach(function (s, i) { s.style.transform = keep[i]; });
      word.style.transform = wt; void word.offsetWidth; word.style.transition = wtr;
      var wy0 = Math.min.apply(null, L.map(function (l) { return l.y; }));
      wy1 = Math.max.apply(null, L.map(function (l) { return l.y + l.h; }));
      wh = wy1 - wy0; wcy = (wy0 + wy1) / 2;
      fs = parseFloat(getComputedStyle(word).fontSize) || 100;
      if (tag) tag.style.fontSize = Math.max(14, fs * 0.13).toFixed(1) + "px";
      var rand = rng(3);
      lines = [];
      for (var i = 0; i < 26; i++) lines.push({ y: wcy + (rand() - 0.5) * wh * 2.2, len: W * (0.15 + rand() * 0.45), sp: 1.6 + rand() * 1.8, off: rand(), w: rand() < 0.25 ? 2 : 1, a: 0.25 + rand() * 0.4 });
      if (prevX.length !== spans.length) prevX = spans.map(function () { return 0; });
      idle = false;
    }
    function read() {
      var r = pin.getBoundingClientRect(), total = pin.offsetHeight - innerHeight;
      target = total > 0 ? clamp(-r.top / total) : 0;
      return r.bottom > 0 && r.top < innerHeight;
    }
    function arrive(i) { return 0.35 + i * 0.17; }

    function draw(t, p, dt) {
      B.setTransform(dpr, 0, 0, dpr, 0, 0); F.setTransform(dpr, 0, 0, dpr, 0, 0);
      B.clearRect(0, 0, W, H); F.clearRect(0, 0, W, H);
      // Speed-Lines
      var sl = Math.max(smooth(0.05, 0.3, t) * (1 - smooth(1.6, 2.4, t)), smooth(0.18, 0.4, p) * (1 - smooth(0.85, 1, p)));
      if (sl > 0) {
        for (var k = 0; k < lines.length; k++) {
          var ln = lines[k], lx = ((t * ln.sp + ln.off + p * 3) % 1.6 - 0.3) * (W + ln.len) - ln.len;
          var g = B.createLinearGradient(lx, 0, lx + ln.len, 0); g.addColorStop(0, INK + "0)"); g.addColorStop(1, INK + (ln.a * sl) + ")");
          B.strokeStyle = g; B.lineWidth = ln.w; B.beginPath(); B.moveTo(lx, ln.y); B.lineTo(lx + ln.len, ln.y); B.stroke();
        }
      }
      var crouch = smooth(0.03, 0.2, p) * (1 - smooth(0.2, 0.3, p));
      for (var i = 0; i < spans.length; i++) {
        // Einfahrt
        var a0 = arrive(i), u = clamp((t - (a0 - 0.55)) / 0.55), x = -(L[i].cx + W * 0.25 + i * 40) * (1 - eOutExpo(u));
        var after = t - a0, skew = 0;
        if (u < 1) skew = -16 * (1 - u * 0.4); else if (after < 0.6) skew = 9 * Math.exp(-after * 7) * Math.sin(after * 18 + 0.4) + (after < 0.05 ? -4 : 0);
        // Abfahrt beim Scrollen (D zuerst)
        var pi = 0.24 + (spans.length - 1 - i) * 0.075, ul = clamp((p - pi) / 0.24);
        x += Math.pow(ul, 2.3) * (W - L[i].x + W * 0.2);
        if (ul > 0) skew = Math.min(skew, -20 * smooth(0, 0.3, ul));
        else if (crouch > 0) { skew += -7 * crouch; x += Math.sin(t * 70 + i) * crouch * 1.2; }
        // Bewegungsunschärfe aus der Geschwindigkeit
        var v = (x - prevX[i]) / dt; prevX[i] = x;
        var blur = Math.min(Math.abs(v) * 0.018, fs * 0.6), sh = [];
        if (blur > 1) for (var j = 1; j <= 6; j++) sh.push((-Math.sign(v) * blur * j / 6).toFixed(1) + "px 0 0 " + INK + (0.3 * (1 - j / 7)).toFixed(3) + ")");
        var sx = 1 - crouch * 0.06 + Math.min(0.25, Math.abs(v) * 0.00004), st = spans[i].style;
        st.transform = "translateX(" + x.toFixed(1) + "px) skewX(" + skew.toFixed(2) + "deg) scaleX(" + sx.toFixed(3) + ")";
        st.opacity = u > 0 ? 1 : 0;
        st.textShadow = sh.length ? sh.join(",") : "none";
        // Bremslicht
        var bl = after > 0 ? Math.exp(-after * 4.5) : 0;
        if (bl > 0.01 && ul === 0) {
          F.save(); F.globalAlpha = bl; F.fillStyle = "#ff2b2b"; F.shadowColor = "rgba(255,30,30,.9)"; F.shadowBlur = 14;
          F.fillRect(L[i].x + L[i].w * 0.12 + x, wy1 + wh * 0.06, L[i].w * 0.76, Math.max(2, wh * 0.025)); F.restore();
        }
      }
      // Danach: Leistungen erscheinen
      var tg = smooth(0.6, 0.85, p), mob = W < 600;
      tags.forEach(function (el, n) {
        var k2 = n === 1 && mob ? smooth(0.66, 0.9, p) : tg;
        el.style.opacity = k2.toFixed(3);
        el.style.transform = k2 > 0 && k2 < 1 ? "translateX(" + (-(1 - eOutExpo(k2)) * W * 0.5).toFixed(1) + "px)" : "none";
      });
      hero.style.setProperty("--hint", (1 - clamp(p / 0.04)).toFixed(3));
    }

    function frame(now) {
      requestAnimationFrame(frame);
      var vis = read();
      if (!started) {
        // erst loslegen, wenn der Vorhang weg ist und der Tab wirklich sichtbar ist
        if (now < startAt || document.visibilityState === "hidden") return;
        started = true; lastNow = now;
      }
      // Zeit selbst aufsummieren: Hintergrund-Tab, Stromsparmodus oder ein Ruckler überspringen nichts
      var dt = Math.min(0.1, Math.max(0, (now - lastNow) / 1000)); lastNow = now; t += dt;
      dt = Math.max(1 / 240, dt);
      if (!vis) return;
      if (!live && t > 1.5) { live = true; hero.classList.add("is-live"); }
      cur += (target - cur) * Math.min(1, dt * 9);
      if (Math.abs(target - cur) < 0.0005) cur = target;
      // Ruhe: Intro fertig und nicht gescrollt → nichts neu zeichnen (spart Akku)
      var still = t > 2.6 && cur === 0;
      if (still && idle) return;
      draw(t, cur, dt);
      idle = still;
    }
    measure();
    window.addEventListener("resize", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    // Start, sobald der Vorhang (Preloader) den Schriftzug freigibt
    startAt = performance.now() + (document.querySelector(".preloader") ? 350 : 0);
    requestAnimationFrame(frame);
  }

  /* ---------- Google-Bewertungen ---------- */
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function starsHTML(v) {
    var out = "";
    for (var i = 1; i <= 5; i++) {
      var f = Math.max(0, Math.min(1, v - (i - 1)));
      out += '<span class="star" style="--f:' + Math.round(f * 100) + '%"></span>';
    }
    return out;
  }
  function reviews() {
    var sec = document.querySelector("[data-reviews]");
    var G = C.google || {};
    if (!sec) return;
    sec.hidden = false;
    // Nur für den Inhaber: Design-Vorschau mit deutlich markierten Beispieltexten (Adresse mit ?vorschau öffnen).
    // Öffentliche Besucher sehen das nie – erfundene Bewertungen dürfen nicht veröffentlicht werden.
    var preview = !(G.rating > 0) && /[?&]vorschau\b/.test(location.search);
    if (preview) {
      G = { rating: 4.9, count: 0, reviews: [
        { name: "Beispiel", stars: 5, date: "Platzhalter", text: "BEISPIELTEXT – hier erscheint später eine echte Bewertung aus eurem Google-Profil." },
        { name: "Beispiel", stars: 5, date: "Platzhalter", text: "BEISPIELTEXT – so sieht eine Bewertungskarte aus. Lange Texte werden nach einigen Zeilen gekürzt." },
        { name: "Beispiel", stars: 5, date: "Platzhalter", text: "BEISPIELTEXT – drei bis sechs der besten Google-Bewertungen werden hier gezeigt." }
      ] };
      sec.classList.add("reviews--preview");
      sec.querySelector(".container").insertAdjacentHTML("afterbegin", '<p class="preview-banner">Vorschau mit Beispieltexten – nur über ?vorschau sichtbar, nicht für Besucher. Zahlen und Texte sind Platzhalter.</p>');
    }
    if (!(G.rating > 0)) {
      // Noch keine Google-Daten eingetragen: Aufruf zum Bewerten statt Sternen/Zahlen
      sec.classList.add("reviews--cta");
      var h = sec.querySelector(".section__title");
      if (h) h.innerHTML = "Zufrieden mit uns?<br><em>Sagen Sie es weiter.</em>";
      sec.querySelector(".rating").innerHTML =
        '<div class="stars stars--lg stars--outline" aria-hidden="true">' + starsHTML(5) + "</div>" +
        '<p class="rating__count">Wir freuen uns über Ihre Bewertung auf Google – das dauert nur eine Minute und hilft uns sehr.</p>' +
        '<div class="rating__links"><a class="btn" data-href="greview" href="#" target="_blank" rel="noopener">Jetzt bewerten</a>' +
        '<a class="link-arrow" data-href="gprofile" href="#" target="_blank" rel="noopener">Bewertungen auf Google ansehen</a></div>';
      var t = sec.querySelector("[data-reviews-track]"); if (t) t.remove();
      var n = sec.querySelector(".reviews__note"); if (n) n.remove();
      // Links neu setzen (wurden vor dem Einfügen vergeben)
      var gp = (C.google && C.google.profileUrl) || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.name + ", " + C.street + ", " + C.zip + " " + C.city);
      sec.querySelectorAll("[data-href=gprofile]").forEach(function (a) { a.href = gp; });
      sec.querySelectorAll("[data-href=greview]").forEach(function (a) { a.href = (C.google && C.google.reviewUrl) || gp; });
      return;
    }
    var nf = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    sec.querySelector("[data-rating-value]").textContent = nf.format(G.rating);
    sec.querySelector("[data-rating-stars]").innerHTML = starsHTML(G.rating);
    sec.querySelector("[data-rating-count]").textContent = new Intl.NumberFormat("de-DE").format(G.count || 0);
    var list = (G.reviews || []).filter(function (r) { return r && r.text; });
    var track = sec.querySelector("[data-reviews-track]");
    if (!list.length) { track.remove(); return; }
    track.innerHTML = list.map(function (r, i) {
      return '<figure class="review" data-reveal style="--d:' + (i % 3) * 0.08 + 's">' +
        '<div class="stars" role="img" aria-label="' + (r.stars || 5) + ' von 5 Sternen">' + starsHTML(r.stars || 5) + "</div>" +
        "<blockquote>" + esc(r.text) + "</blockquote>" +
        '<figcaption><span class="review__avatar" aria-hidden="true">' + esc((r.name || "?").charAt(0)) + "</span><span><b>" + esc(r.name || "Google-Nutzer") + "</b><small>" + esc(r.date || "") + (r.date ? " · " : "") + "Google</small></span></figcaption></figure>";
    }).join("");
  }

  /* ---------- Formulare: direkt senden über PHP (api/anfrage.php) ----------
     Ohne PHP (z. B. lokal oder auf pages.dev) öffnet sich stattdessen das E-Mail-Programm. */
  var directP = null;
  function canDirect() {
    if (directP) return directP;
    directP = !/^https?:$/.test(location.protocol) ? Promise.resolve(false)
      : fetch("api/anfrage.php", { headers: { Accept: "application/json" } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { return !!(j && j.enabled); })
        .catch(function () { return false; });
    return directP;
  }
  function postForm(fd, onProgress) {
    return new Promise(function (resolve) {
      var x = new XMLHttpRequest();
      x.open("POST", "api/anfrage.php");
      x.timeout = 120000;
      if (x.upload && onProgress) x.upload.onprogress = function (e) { if (e.lengthComputable) onProgress(e.loaded / e.total); };
      x.onload = function () { var j = {}; try { j = JSON.parse(x.responseText); } catch (e) { /* ok */ } resolve({ ok: x.status === 200 && j.ok, status: x.status, data: j }); };
      x.onerror = x.ontimeout = function () { resolve({ ok: false, status: 0, data: {} }); };
      x.send(fd);
    });
  }
  function errorText(r) {
    var e = r.data && r.data.error;
    if (r.status === 413 || e === "too_large") return "Die Fotos sind zu groß – bitte weniger Fotos auswählen und erneut senden.";
    if (e === "rate_limited") return "Zu viele Anfragen in kurzer Zeit – bitte später erneut versuchen oder uns anrufen.";
    if (e === "missing" || e === "invalid") return "Bitte prüfen Sie Ihre Angaben (Pflichtfelder und E-Mail-Adresse).";
    return "Das Senden hat leider nicht geklappt. Bitte per WhatsApp senden oder anrufen: " + (C.phoneDisplay || "");
  }

  /* Fotos beim Ankauf: werden im Browser verkleinert und beim Absenden mitgeschickt (im PDF) */
  function photoPicker(form) {
    var box = form.querySelector("[data-uploader]");
    if (!box) return null;
    var input = box.querySelector("[data-uploader-input]"), list = box.querySelector("[data-uploader-list]");
    var note = box.querySelector("[data-uploader-note]"), drop = box.querySelector("[data-uploader-drop]");
    var MAX = 10, items = [], seq = 0, enabled = true;
    function shrink(file, max, q) {
      return new Promise(function (res) {
        var url = URL.createObjectURL(file), img = new Image();
        img.onload = function () {
          var s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          var c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
          var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (b) { URL.revokeObjectURL(url); res(b); }, "image/jpeg", q);
        };
        img.onerror = function () { URL.revokeObjectURL(url); res(null); };
        img.src = url;
      });
    }
    function render() {
      list.innerHTML = items.map(function (it) {
        return '<li class="up up--' + it.status + '">' + (it.thumb ? '<img src="' + it.thumb + '" alt="">' : "") +
          (it.status === "up" ? '<span class="up__spin" aria-label="Wird vorbereitet"></span>' : "") +
          (it.status === "err" ? '<span class="up__err">' + esc(it.err) + "</span>" : "") +
          '<button type="button" class="up__x" aria-label="Foto entfernen" data-rm="' + it.k + '">×</button></li>';
      }).join("");
      drop.classList.toggle("is-full", items.length >= MAX);
      drop.querySelector("strong").textContent = items.length ? (items.length >= MAX ? "Maximal 10 Fotos" : "Weitere Fotos hinzufügen") : "Fotos hinzufügen";
    }
    function add(files) {
      if (!enabled) return;
      Array.prototype.slice.call(files, 0, MAX - items.length).forEach(function (file) {
        var it = { k: ++seq, status: "up", thumb: "" };
        items.push(it);
        shrink(file, 1400, 0.8).then(function (b) {
          if (b && b.size > 1500000) return shrink(file, 1100, 0.72);
          return b;
        }).then(function (b) {
          if (!b) { it.status = "err"; it.err = "Format nicht unterstützt"; }
          else { it.blob = b; it.thumb = URL.createObjectURL(b); it.status = "ok"; }
          render();
        });
      });
      render();
    }
    input.addEventListener("change", function () { add(input.files); input.value = ""; });
    list.addEventListener("click", function (e) {
      var b = e.target.closest("[data-rm]"); if (!b) return;
      items = items.filter(function (i) { if (String(i.k) === b.getAttribute("data-rm")) { if (i.thumb) URL.revokeObjectURL(i.thumb); return false; } return true; });
      render();
    });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("is-drag"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("is-drag"); }); });
    drop.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files); });
    return {
      busy: function () { return items.some(function (i) { return i.status === "up"; }); },
      blobs: function () { return items.filter(function (i) { return i.status === "ok"; }).map(function (i) { return i.blob; }); },
      clear: function () { items.forEach(function (i) { if (i.thumb) URL.revokeObjectURL(i.thumb); }); items = []; render(); },
      disable: function (msg) {
        enabled = false; box.classList.add("is-off"); input.disabled = true; note.textContent = "";
        drop.querySelector("strong").textContent = "Foto-Versand noch nicht aktiv";
        drop.querySelector("span").textContent = msg;
      }
    };
  }

  /* ---------- Auswahl-Menü „Womit möchten Sie senden?“ (Mail-App, Gmail, Outlook, WhatsApp) ---------- */
  var UA = navigator.userAgent || "";
  var isIOS = /iPad|iPhone|iPod/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(UA);
  var SHEET_ICONS = {
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 6.5 9 6.5 9-6.5"/></svg>',
    gmail: '<b>G</b>', outlook: '<b>O</b>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.4 8.4 0 1 1 21 11.5z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2"/></svg>'
  };
  var sheetEl = null, sheetMsg = null, sheetDone = null, lastFocus = null;
  function sheetOptions() {
    if (isIOS) return [
      ["mail", "Mail", "iPhone-Mail oder Ihre Standard-App"], ["gmail", "Gmail", "Gmail-App"], ["outlook", "Outlook", "Outlook-App"],
      ["whatsapp", "WhatsApp", "Nachricht an " + (C.phoneDisplay || "uns")], ["copy", "Text kopieren", "z. B. für GMX, WEB.DE oder andere"]];
    if (isAndroid) return [
      ["mail", "E-Mail-App wählen", "Gmail, Outlook, GMX, WEB.DE …"], ["whatsapp", "WhatsApp", "Nachricht an " + (C.phoneDisplay || "uns")],
      ["copy", "Text kopieren", "für jede andere App"]];
    return [
      ["gmail", "Gmail", "öffnet sich im Browser"], ["outlook", "Outlook.com", "öffnet sich im Browser"],
      ["mail", "Mail-Programm", "Outlook, Apple Mail, Thunderbird …"], ["whatsapp", "WhatsApp", "WhatsApp Web oder Desktop-App"],
      ["copy", "Text kopieren", "z. B. für GMX, WEB.DE oder andere"]];
  }
  function buildSheet() {
    sheetEl = document.createElement("div");
    sheetEl.className = "sheet";
    sheetEl.setAttribute("role", "dialog"); sheetEl.setAttribute("aria-modal", "true"); sheetEl.setAttribute("aria-labelledby", "sheet-title");
    sheetEl.innerHTML = '<div class="sheet__bg" data-close></div><div class="sheet__panel"><span class="sheet__grip" aria-hidden="true"></span>' +
      '<h3 id="sheet-title">Womit möchten Sie senden?</h3>' +
      '<p class="sheet__sub">Ihre Nachricht an uns ist fertig vorbereitet – Sie müssen sie nur noch absenden.</p>' +
      '<p class="sheet__tip" data-sheet-tip hidden>📎 Fotos Ihres Fahrzeugs können Sie in der E-Mail bzw. in WhatsApp direkt anhängen.</p>' +
      '<div class="sheet__list">' + sheetOptions().map(function (o) {
        return '<button type="button" class="sheet__opt" data-via="' + o[0] + '"><span class="sheet__ico sheet__ico--' + o[0] + '">' + SHEET_ICONS[o[0]] + "</span>" +
          '<span class="sheet__txt"><b>' + o[1] + "</b><small>" + o[2] + '</small></span><svg class="sheet__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 6 6 6-6 6"/></svg></button>';
      }).join("") + "</div>" +
      '<p class="sheet__copied" data-copied hidden></p>' +
      '<button type="button" class="sheet__cancel" data-close>Abbrechen</button></div>';
    document.body.appendChild(sheetEl);
    sheetEl.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) return closeSheet();
      var b = e.target.closest("[data-via]"); if (b) sendVia(b.getAttribute("data-via"));
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sheetEl.classList.contains("is-open")) closeSheet(); });
  }
  function openSheet(msg, withPhotos, done) {
    if (!sheetEl) buildSheet();
    sheetMsg = msg; sheetDone = done; lastFocus = document.activeElement;
    sheetEl.querySelector("[data-sheet-tip]").hidden = !withPhotos;
    sheetEl.querySelector("[data-copied]").hidden = true;
    document.body.classList.add("is-locked");
    requestAnimationFrame(function () { sheetEl.classList.add("is-open"); var f = sheetEl.querySelector(".sheet__opt"); if (f) f.focus({ preventScroll: true }); });
  }
  function closeSheet() {
    if (!sheetEl) return;
    sheetEl.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  // App-Link versuchen (iPhone), sonst nach kurzer Zeit die Web-Version öffnen
  function tryApp(appUrl, webUrl) {
    var t = setTimeout(function () { if (!document.hidden) location.href = webUrl; }, 1600);
    var stop = function () { clearTimeout(t); };
    window.addEventListener("pagehide", stop, { once: true });
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); }, { once: true });
    location.href = appUrl;
  }
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise(function (res, rej) {
      var ta = document.createElement("textarea"); ta.value = t; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); try { document.execCommand("copy") ? res() : rej(); } catch (e) { rej(e); } ta.remove();
    });
  }
  function sendVia(via) {
    var m = sheetMsg, e = encodeURIComponent, to = C.email;
    var mailto = "mailto:" + to + "?subject=" + e(m.subject) + "&body=" + e(m.body);
    var gmailWeb = "https://mail.google.com/mail/?view=cm&fs=1&to=" + e(to) + "&su=" + e(m.subject) + "&body=" + e(m.body);
    var outlookWeb = "https://outlook.live.com/mail/0/deeplink/compose?to=" + e(to) + "&subject=" + e(m.subject) + "&body=" + e(m.body);
    var hint = "Ihre Nachricht ist vorbereitet – bitte in der App noch auf „Senden“ tippen.";
    if (via === "copy") {
      copyText("An: " + to + "\nBetreff: " + m.subject + "\n\n" + m.body).then(function () {
        var c = sheetEl.querySelector("[data-copied]"); c.hidden = false;
        c.textContent = "✓ Kopiert! Jetzt in Ihrer Mail-App eine neue E-Mail an " + to + " öffnen und den Text einfügen.";
      }, function () {
        var c = sheetEl.querySelector("[data-copied]"); c.hidden = false; c.textContent = "Kopieren nicht möglich – bitte eine andere Option wählen.";
      });
      return;
    }
    closeSheet();
    if (via === "mail") location.href = mailto;
    else if (via === "gmail") { if (isIOS) tryApp("googlegmail:///co?to=" + e(to) + "&subject=" + e(m.subject) + "&body=" + e(m.body), gmailWeb); else window.open(gmailWeb, "_blank", "noopener"); }
    else if (via === "outlook") { if (isIOS) tryApp("ms-outlook://compose?to=" + e(to) + "&subject=" + e(m.subject) + "&body=" + e(m.body), outlookWeb); else window.open(outlookWeb, "_blank", "noopener"); }
    else if (via === "whatsapp") { window.open("https://wa.me/" + C.whatsapp + "?text=" + e(m.body), "_blank", "noopener"); hint = "Ihre Nachricht ist vorbereitet – bitte in WhatsApp noch auf „Senden“ tippen."; }
    if (sheetDone) sheetDone(hint);
  }

  /* Pflichtfelder prüfen: fehlende/falsche Felder rot markieren, Hinweis darunter */
  function validate(form, extra) {
    var bad = [];
    function mark(el, msg) {
      var f = el.closest(".field"); if (!f) return;
      f.classList.add("is-invalid");
      var e = f.querySelector(".field__err");
      if (!e) { e = document.createElement("small"); e.className = "field__err"; f.appendChild(e); }
      e.textContent = msg;
      el.setAttribute("aria-invalid", "true");
      if (bad.indexOf(el) < 0) bad.push(el);
    }
    form.querySelectorAll(".field.is-invalid").forEach(function (f) {
      f.classList.remove("is-invalid");
      var e = f.querySelector(".field__err"); if (e) e.remove();
      var i = f.querySelector("[aria-invalid]"); if (i) i.removeAttribute("aria-invalid");
    });
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (el.type === "hidden" || el.type === "file" || el.closest(".hp")) return;
      var v = (el.value || "").trim();
      if (el.required && !v) mark(el, el.tagName === "SELECT" ? "Bitte auswählen" : "Bitte ausfüllen");
      else if (v && el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) mark(el, "Bitte eine gültige E-Mail-Adresse eingeben");
      else if (v && el.hasAttribute("data-reg") && !/^(0[1-9]|1[0-2])\/(19|20)\d{2}$/.test(v)) mark(el, "Bitte im Format MM/JJJJ, z. B. 03/2018");
    });
    if (extra) extra(mark);
    return bad;
  }

  /* Gemeinsamer Ablauf für beide Formulare */
  function setupForm(form, o) {
    var status = document.createElement("p");
    status.className = "form__status"; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    var bar = document.createElement("div");
    bar.className = "form__progress"; bar.hidden = true; bar.innerHTML = "<i></i>";
    form.querySelector(".form__actions").after(status);
    status.before(bar);
    var submit = form.querySelector("[type=submit]"), label = submit.innerHTML, sending = false;
    function say(t, kind) { status.textContent = t; status.classList.toggle("is-error", kind === "err"); status.classList.toggle("is-busy", kind === "busy"); status.classList.toggle("is-ok", kind === "ok"); }
    function busy(on) {
      sending = on; submit.disabled = on; submit.classList.toggle("is-loading", on);
      form.classList.toggle("is-sending", on);
      bar.hidden = !on; if (on) bar.firstChild.style.width = "3%";
      if (!on) submit.innerHTML = label;
    }
    // Rote Markierung verschwindet, sobald das Feld korrigiert wird
    form.addEventListener("input", function (e) {
      var f = e.target.closest(".field.is-invalid");
      if (f && (e.target.value || "").trim()) { f.classList.remove("is-invalid"); var x = f.querySelector(".field__err"); if (x) x.remove(); e.target.removeAttribute("aria-invalid"); }
      if (!form.querySelector(".field.is-invalid") && status.classList.contains("is-error")) say("");
    });
    form.addEventListener("change", function (e) { if (e.target.tagName === "SELECT") e.target.dispatchEvent(new Event("input", { bubbles: true })); });
    function check() {
      var bad = validate(form, o.extra);
      if (!bad.length) return true;
      say(bad.length === 1 ? "Bitte das rot markierte Feld ausfüllen." : "Bitte die " + bad.length + " rot markierten Felder ausfüllen.", "err");
      bad[0].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      setTimeout(function () { try { bad[0].focus({ preventScroll: true }); } catch (e) { bad[0].focus(); } }, 350);
      return false;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending || !check()) return;
      if (C.formMode !== "server") {
        openSheet(o.mail(), !!o.photoTip, function (hint) { say(hint, "ok"); });
        return;
      }
      if (o.photos && o.photos.busy()) { say("Bitte kurz warten – die Fotos werden noch vorbereitet …", "busy"); return; }
      busy(true);
      submit.innerHTML = "Wird gesendet …";
      say("Bitte warten – Ihre Anfrage wird gesendet" + (o.photos && o.photos.blobs().length ? " (mit Fotos kann das einige Sekunden dauern)" : "") + " …", "busy");
      canDirect().then(function (direct) {
        if (!direct) {
          busy(false);
          say("Der Online-Versand ist hier noch nicht aktiv. Bitte nutzen Sie „Per WhatsApp“ oder rufen Sie uns an: " + (C.phoneDisplay || ""), "err");
          return;
        }
        var fd = new FormData(form);
        if (o.photos) o.photos.blobs().forEach(function (b, i) { fd.append("fotos[]", b, "foto-" + (i + 1) + ".jpg"); });
        postForm(fd, function (p) {
          var pct = Math.max(3, Math.min(99, Math.round(p * 100)));
          bar.firstChild.style.width = pct + "%";
          submit.textContent = pct < 99 ? "Wird gesendet … " + pct + " %" : "Wird verarbeitet …";
        }).then(function (r) {
          busy(false);
          if (!r.ok) { say(errorText(r), "err"); return; }
          say("");
          var name = (new FormData(form).get("name") || "").split(" ")[0];
          var done = document.createElement("div");
          done.className = "form__done";
          done.innerHTML = '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg>' +
            "<h3>Vielen Dank" + (name ? ", " + esc(name) : "") + "!</h3><p>" + esc(o.thanks) + "</p>" +
            '<button type="button" class="btn btn--ghost">Neue Anfrage</button>';
          form.classList.add("is-sent");
          form.appendChild(done);
          done.querySelector("button").addEventListener("click", function () {
            form.reset(); if (o.photos) o.photos.clear(); done.remove(); form.classList.remove("is-sent");
          });
          form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        });
      });
    });
    var wa = form.querySelector("[data-wa-send]");
    if (wa) wa.addEventListener("click", function () {
      if (!check()) return;
      window.open("https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(o.mail().body), "_blank", "noopener");
      say("Ihre Nachricht ist vorbereitet – bitte in WhatsApp noch auf „Senden“ tippen.", "ok");
    });
  }

  function forms() {
    var server = C.formMode === "server";
    // Elemente je nach Modus ein-/ausblenden (Foto-Upload nur mit Server)
    document.querySelectorAll("[data-server-only]").forEach(function (el) { el.hidden = !server; });
    document.querySelectorAll("[data-mail-only]").forEach(function (el) { el.hidden = server; });
    var greet = "Hallo " + (C.name || "") + ",";
    var sign = function (d) {
      return ["", "Viele Grüße", d.get("name"), d.get("phone") ? "Telefon: " + d.get("phone") : "", d.get("email") ? "E-Mail: " + d.get("email") : ""].filter(function (x, i) { return i < 3 || x; });
    };
    var fmtNum = function (v, unit) {
      var n = String(v || "").replace(/[.\s€]/g, "");
      return /^\d+$/.test(n) ? new Intl.NumberFormat("de-DE").format(+n) + " " + unit : v;
    };

    // Allgemeines Kontaktformular
    var form = document.querySelector("[data-contact-form]");
    if (form) {
      var topic = form.querySelector("[name=topic]");
      setupForm(form, {
        thanks: "Ihre Anfrage ist bei uns eingegangen. Wir melden uns schnellstmöglich bei Ihnen.",
        extra: function (mark) {
          var ph = form.querySelector("[name=phone]"), em = form.querySelector("[name=email]");
          if (!ph.value.trim() && !em.value.trim()) { mark(ph, "Telefon oder E-Mail angeben"); mark(em, "Telefon oder E-Mail angeben"); }
        },
        mail: function () {
          var d = new FormData(form);
          var body = [greet, "", d.get("message") || ""];
          body.push("", "Anliegen: " + d.get("topic"));
          if (d.get("car")) body.push("Fahrzeug: " + d.get("car"));
          return { subject: d.get("topic") + " – Anfrage von " + d.get("name"), body: body.concat(sign(d)).join("\n") };
        }
      });
      var choose = function (v) {
        for (var i = 0; i < topic.options.length; i++) if (topic.options[i].value === v) { topic.value = v; return; }
      };
      document.querySelectorAll("[data-topic]").forEach(function (a) {
        a.addEventListener("click", function () { choose(a.getAttribute("data-topic")); });
      });
      var q = new URLSearchParams(location.search).get("anliegen");
      if (q) choose(q);
    }

    // Ankauf-Formular: Fahrzeugdaten (+ im Server-Modus Fotos → PDF)
    var ank = document.querySelector("[data-ankauf-form]");
    if (ank) {
      var reg = ank.querySelector("[data-reg]");
      if (reg) reg.addEventListener("input", function () {
        var d = reg.value.replace(/\D/g, "").slice(0, 6);
        reg.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
      });
      var photos = server ? photoPicker(ank) : null;
      if (photos) canDirect().then(function (ok) {
        if (!ok) photos.disable("Foto-Versand ist hier noch nicht aktiv – Fotos bitte per WhatsApp schicken.");
      });
      setupForm(ank, {
        photos: photos,
        photoTip: true,
        thanks: "Ihre Fahrzeugdaten und Fotos sind bei uns eingegangen. Wir melden uns schnellstmöglich mit einem Angebot.",
        mail: function () {
          var d = new FormData(ank);
          var car = (d.get("make") + " " + d.get("model")).trim();
          var body = [greet, "", "ich möchte mein Fahrzeug verkaufen und bitte um ein unverbindliches Angebot.", "", "MEIN FAHRZEUG"];
          [["make", "Marke"], ["model", "Modell"], ["type", "Fahrzeugtyp"], ["doors", "Anzahl der Türen"], ["reg", "Erstzulassung"], ["km", "Kilometerstand"], ["fuel", "Kraftstoffart"], ["gear", "Getriebe"], ["price", "Preisvorstellung"]].forEach(function (f) {
            var v = d.get(f[0]);
            if (f[0] === "km") v = fmtNum(v, "km");
            if (f[0] === "price") v = v ? fmtNum(v, "€") : "keine Angabe";
            body.push(f[1] + ": " + (v || "–"));
          });
          if (d.get("message")) body.push("", "Anmerkungen: " + d.get("message"));
          body.push("", "Fotos meines Fahrzeugs füge ich dieser Nachricht bei.");
          return { subject: "Fahrzeugankauf: " + car + " – Angebot erbeten", body: body.concat(sign(d)).join("\n") };
        }
      });
    }
  }

  /* ---------- Start ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    applyConfig();
    bgLines();
    reviews();
    consent.init();
    mobileDeEmbed();
    splitHeadings();
    prepStatement();
    plx = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    menu();
    header();
    magnetic();
    forms();
    preloader(function () {
      root.classList.add("is-ready");
      observe(document);
      heroSpeed();
    });
  });

  window.AZN = { observe: observe, count: count };
})();
